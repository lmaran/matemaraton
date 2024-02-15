const courseService = require("../services/course.service");
const sheetService = require("../services/sheet.service");
const autz = require("../services/autz.service");
const exerciseService = require("../services/exercise.service");
//const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");
const lessonHelper = require("../helpers/lesson.helper");
const dateTimeHelper = require("../helpers/date-time.helper");
const lessonService = require("../services/lesson.service");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.getOneById = async (req, res) => {
    const { sheetId } = req.params;
    let { type } = req.query;

    const availableTypes = ["statements", "hints", "answers", "solutions"];
    if (!availableTypes.includes(type)) type = "statements"; // default value

    try {
        // Validate parameters
        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        // Get exercises from DB
        let exercises = [];
        if (sheet.exerciseIds && sheet.exerciseIds.length > 0) {
            exercises = await exerciseService.getAllByIds(sheet.exerciseIds);
        }

        let pageTitle = sheet.name || "Temă individuală";

        // For statements, answers and hints we will preserve the original page title (no prefix)
        if (type == "solutions") pageTitle = `Soluții-${pageTitle}`;

        if (sheet.title) {
            sheet.titlePreview = markdownService.render(sheet.title);
        }

        // Add preview
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
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        const { lessonId } = sheet;

        if (lessonId) {
            const lesson = await lessonService.getOneById(lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            const course = await courseService.getOneById(lesson.courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);

            data.courseId = lesson.courseId;
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
    const { lessonId, cart } = req.query;

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

            // Get exercises from DB
            if (allExercisesIds.length > 0) {
                exercisesFromDB = await exerciseService.getAllByIds(allExercisesIds);
            }

            // Add preview
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
        }

        const fullUserName = `${req.user.firstName} ${req.user.lastName}`.trim();
        const fullUserNameText = fullUserName ? `${fullUserName}, ` : "";
        const currentDateStr = dateTimeHelper.getShortDateRo(new Date()); // ex: 22.11.2023

        // Default options
        const sheet = {
            name: `Tema`,
            title: `#### Titlu\r\n##### Subtitlu\r\n ${fullUserNameText}[matemaraton.ro](https://matemaraton.ro), ${currentDateStr}`,
        };

        const data = {
            exercises,
            sheet,
        };

        if (lessonId) {
            const lesson = await lessonService.getOneById(lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            const course = await courseService.getOneById(lesson.courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);

            data.courseId = lesson.courseId;
            data.courseCode = course.code;
            data.chapterId = chapter.id;
            data.chapterIndex = chapterIndex;
            data.lessonId = lessonId;
            data.lessonIndex = lessonIndex;

            data.sheet.name = `TemaX-cls${course.grade}: ${lesson.name}`;
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
    const { lessonId, name, title, exerciseIdsInput } = req.body;
    let exerciseIds = [];

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        if (exerciseIdsInput) exerciseIds = Array.isArray(exerciseIdsInput) ? exerciseIdsInput : [exerciseIdsInput];

        const sheet = {
            name,
            title,
            exerciseIds,
        };

        if (lessonId) {
            sheet.lessonId = lessonId;
        }

        const result = await sheetService.insertOne(sheet);
        const sheetId = result.insertedId.toString();

        // Attach the sheet to the lesson (if the lesson exists)
        if (lessonId) {
            const lesson = await lessonService.getOneById(lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            lesson.sheetIds = lesson.sheetIds || [];
            lesson.sheetIds.push(sheetId);

            lessonService.updateOne(lesson);
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

        // Get exercises from DB
        let exercises = [];
        if (sheet.exerciseIds && sheet.exerciseIds.length > 0) {
            exercises = await exerciseService.getAllByIds(sheet.exerciseIds);
        }

        // Add preview
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

        const { lessonId } = sheet;

        if (lessonId) {
            const lesson = await lessonService.getOneById(lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            const course = await courseService.getOneById(lesson.courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            data.courseId = lesson.courseId;
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
            sheet.isHidden = false;
        }

        if (isActive === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            sheet.isActive = true;
        } else {
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

    const { lessonId } = sheet;

    if (lessonId) {
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const course = await courseService.getOneById(lesson.courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        if (!lesson) return res.status(500).send("Lecție negăsită!");

        if (lesson.sheetIds) lesson.sheetIds = lesson.sheetIds.filter((x) => x !== sheetId);

        courseService.updateOne(course);
    }

    // Delete from sheets
    sheetService.deleteOneById(sheetId);

    if (lessonId) res.redirect(`/lectii/${lessonId}`);
    else res.redirect(`/fise`);
};

exports.jsonGetOneById = async (req, res) => {
    const { sheetId } = req.params;
    try {
        // Validate parameters
        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        const prettyJson = prettyJsonHelper.getPrettyJson(sheet);

        const data = {
            sheetId,
            prettyJson,
        };

        const { lessonId } = sheet;

        if (lessonId) {
            const lesson = await lessonService.getOneById(lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            const course = await courseService.getOneById(lesson.courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            data.courseId = lesson.courseId;
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
