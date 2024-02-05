const courseService = require("../services/course.service");
const sheetService = require("../services/sheet.service");
const autz = require("../services/autz.service");
const exerciseService = require("../services/exercise.service");
//const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");
const lessonHelper = require("../helpers/lesson.helper");
const dateTimeHelper = require("../helpers/date-time.helper");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.getOneById = async (req, res) => {
    const { sheetId } = req.params;
    let { type } = req.query;

    const availableTypes = ["statements", "hints", "answers", "solutions"];
    if (!availableTypes.includes(type)) type = "statements"; // default value

    try {
        // validate parameters
        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        // get exercises from DB
        let exercises = [];
        if (sheet.exerciseIds && sheet.exerciseIds.length > 0) {
            exercises = await exerciseService.getAllByIds(sheet.exerciseIds);
        }

        const pageTitle = "Temă individuală";

        if (sheet.title) {
            sheet.titlePreview = markdownService.render(sheet.title);
        }

        // add preview
        exercises.forEach((exercise, idx) => {
            const statementNumber = `**Problema ${++idx}.**`;

            exerciseHelper.addPreview(exercise, statementNumber, true);

            const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);

            const comma = authorAndSource1 != "" ? ", " : "";
            exercise.authorAndSource1 = `${authorAndSource1}${comma}E.${exercise.code}`;
            exercise.source2 = source2;
        });

        sheet.exercises = exercises;

        const data = {
            sheet,
            type,
            pageTitle,
        };

        const { courseId, lessonId } = sheet;

        if (courseId && lessonId) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            data.courseId = courseId;
            data.courseCode = course.code;
            data.chapterId = chapter.id;
            data.chapterIndex = chapterIndex;
            data.lessonId = lessonId;
            data.lessonIndex = lessonIndex;
        }

        // TODO: fix it
        data.canCreateOrEditSheet = true;

        //res.send(data);
        res.render("sheet/sheet", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
    try {
        const sheets = await sheetService.getAll();

        sheets.forEach((sheet) => (sheet.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(sheet.createdOn))); // ex: 22.11.2023

        const data = {
            sheets,
            // courseId,
            // courseCode: course.code,
            // chapterId,
            // chapterIndex,
            // availablePositions,
            // selectedPosition,
        };

        //res.send(data);
        res.render("sheet/sheets", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createGet = async (req, res) => {
    const { courseId, lessonId } = req.params;
    const { cart } = req.query;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const cartItems = cart ? JSON.parse(cart) : [];

        let exercisesFromDB = [];
        const exercises = []; // returns the exercises in the same order (same ids) as in request
        if (cartItems) {
            const allExercisesIds = (cartItems || []).map((x) => x.e);

            // get exercises from DB
            if (allExercisesIds.length > 0) {
                exercisesFromDB = await exerciseService.getAllByIds(allExercisesIds);
            }

            // add preview
            allExercisesIds.forEach((exerciseId, idx) => {
                const exercise = exercisesFromDB.find((x) => x._id.toString() == exerciseId);

                const statementNumber = `**Problema ${++idx}.**`;

                exerciseHelper.addPreview(exercise, statementNumber, true);

                const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);

                const comma = authorAndSource1 != "" ? ", " : "";
                exercise.authorAndSource1 = `${authorAndSource1}${comma}E.${exercise.code}`;
                exercise.source2 = source2;

                exercises.push(exercise);
            });

            // exercises.forEach((exercise, idx) => {
            //     const statementNumber = `**Problema ${++idx}.**`;

            //     exerciseHelper.addPreview(exercise, statementNumber, true);

            //     const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);

            //     const comma = authorAndSource1 != "" ? ", " : "";
            //     exercise.authorAndSource1 = `${authorAndSource1}${comma}E.${exercise.code}`;
            //     exercise.source2 = source2;
            // });
        }

        const fullUserName = `${req.user.firstName} ${req.user.lastName}`.trim();
        const fullUserNameText = fullUserName ? `${fullUserName}, ` : "";
        const currentDateStr = dateTimeHelper.getShortDateRo(new Date()); // ex: 22.11.2023

        // Default options
        const sheet = {
            sheetType: 3,
            name: "Temă individuală",
            title: `#### Titlu\r\n##### Subtitlu\r\n ${fullUserNameText}[matemaraton.ro](https://matemaraton.ro), ${currentDateStr}`,
        };

        const data = {
            exercises,
            sheet,
        };

        if (courseId && lessonId) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            data.courseId = courseId;
            data.courseCode = course.code;
            data.chapterId = chapter.id;
            data.chapterIndex = chapterIndex;
            data.lessonId = lessonId;
            data.lessonIndex = lessonIndex;

            data.sheet.title = `#### ${lesson.name}\r\n##### Temă individuală\r\n ${fullUserNameText}[matemaraton.ro](https://matemaraton.ro), ${currentDateStr}`;
        }

        (data.sheet.titlePreview = markdownService.render(data.sheet.title)),
            // TODO: fix it
            (data.canCreateOrEditSheet = true);

        //res.send(data);
        res.render("sheet/sheet-create", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createPost = async (req, res) => {
    const { courseId, lessonId, sheetType, name, title, exerciseIdsInput } = req.body;
    let exerciseIds = [];

    // let lesson;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        if (exerciseIdsInput) exerciseIds = Array.isArray(exerciseIdsInput) ? exerciseIdsInput : [exerciseIdsInput];

        const sheet = {
            sheetType,
            name,
            title,
            exerciseIds,
        };

        if (courseId && lessonId) {
            sheet.courseId = courseId;
            sheet.lessonId = lessonId;
        }

        // sheet.theory = {
        //     text: theory.trim(),
        // };
        // if (isHidden === "on") {
        //     // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
        //     lesson.isHidden = true;
        // } else delete lesson.isHidden;
        // chapterRef.lessons = chapterRef.lessons || [];
        // arrayHelper.moveOrInsertAtIndex(chapterRef.lessons, lesson, "id", position);

        const result = await sheetService.insertOne(sheet);
        const sheetId = result.insertedId.toString();

        // Attach the sheet to the lesson (if the lesson exists)
        if (courseId && lessonId) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { lesson } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            lesson.sheetIds = lesson.sheetIds || [];
            lesson.sheetIds.push(sheetId);

            courseService.updateOne(course);
        }

        res.redirect(`/fise/${sheetId}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.updateGet = async (req, res) => {
    const { sheetId } = req.params;
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        // get exercises from DB
        let exercises = [];
        if (sheet.exerciseIds && sheet.exerciseIds.length > 0) {
            exercises = await exerciseService.getAllByIds(sheet.exerciseIds);
        }

        // add preview
        exercises.forEach((exercise, idx) => {
            const statementNumber = `**Problema ${++idx}.**`;

            exerciseHelper.addPreview(exercise, statementNumber, true);

            const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);

            const comma = authorAndSource1 != "" ? ", " : "";
            exercise.authorAndSource1 = `${authorAndSource1}${comma}E.${exercise.code}`;
            exercise.source2 = source2;
        });

        if (sheet.title) sheet.titlePreview = markdownService.render(sheet.title);

        sheet.exercises = exercises;

        const data = {
            sheet,
        };

        const { courseId, lessonId } = sheet;

        if (courseId && lessonId) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            data.courseId = courseId;
            data.courseCode = course.code;
            data.chapterId = chapter.id;
            data.chapterIndex = chapterIndex;
            data.lessonId = lessonId;
            data.lessonIndex = lessonIndex;
        }

        // TODO: fix it
        data.canCreateOrEditSheet = true;

        //res.send(data);
        res.render("sheet/sheet-update", data);
    } catch (err) {
        //console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.updatePost = async (req, res) => {
    const { sheetId } = req.params;
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const { name, title, grade, category, isHidden, isActive } = req.body;

        const sheet = {
            _id: sheetId,
            name,
            title,
            grade,
            category,
            isHidden,
            isActive,
        };

        if (isHidden === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            sheet.isHidden = true;
        } else {
            //delete course.isHidden;
            sheet.isHidden = false;
        }

        if (isActive === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            sheet.isActive = true;
        } else {
            //delete course.isHidden;
            sheet.isActive = false;
        }

        sheetService.updateOne(sheet);

        //res.send(course);
        res.redirect(`/fise/${sheetId}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { sheetId } = req.params;

    const canDelete = await autz.can(req.user, "delete:sheet");
    if (!canDelete) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    // Delete from lesson (if exists)
    const sheet = await sheetService.getOneById(sheetId);
    if (!sheet) return res.status(500).send("Fișă negăsită!");

    const { courseId, lessonId } = sheet;

    if (courseId && lessonId) {
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { lesson } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        if (lesson.sheetIds) lesson.sheetIds = lesson.sheetIds.filter((x) => x !== sheetId);

        courseService.updateOne(course);
    }

    // Delete from sheets
    sheetService.deleteOneById(sheetId);

    if (courseId && lessonId) res.redirect(`/cursuri/${courseId}/lectii/${lessonId}`);
    else res.redirect(`/fise`);
};

exports.jsonGetOneById = async (req, res) => {
    const { sheetId } = req.params;
    try {
        // validate parameters
        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        const prettyJson = prettyJsonHelper.getPrettyJson(sheet);

        const data = {
            sheetId,
            prettyJson,
        };

        const { courseId, lessonId } = sheet;

        if (courseId && lessonId) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            // lesson.sheetIds = lesson.sheets || [];
            // lesson.sheetIds.push(sheetId);

            data.courseId = courseId;
            data.courseCode = course.code;
            data.chapterId = chapter.id;
            data.chapterIndex = chapterIndex;
            data.lessonId = lessonId;
            data.lessonIndex = lessonIndex;
        }

        // TODO: fix it
        data.canCreateOrEditSheet = true;

        //res.send(data);
        res.render("sheet/sheet-json", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};
