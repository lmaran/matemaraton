const courseService = require("../services/course.service");
const sheetService = require("../services/sheet.service");
const autz = require("../services/autz.service");
const exerciseService = require("../services/exercise.service");
//const arrayHelper = require("../helpers/array.helper");
//const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");
const lessonHelper = require("../helpers/lesson.helper");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

//const { availableSections, availableLevels } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { sheetId } = req.params;
    //const { sectionId } = req.query;
    try {
        // validate parameters
        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        // get exercises from DB
        let exercises = [];
        if (sheet.exerciseIds && sheet.exerciseIds.length > 0) {
            exercises = await exerciseService.getAllByIds(sheet.exerciseIds);
        }

        // add preview
        exercises.forEach((exercise) => {
            const statementNumber = `**E.${exercise.code}.**`;

            // if (!exercise) {
            //     exercise = { _id: x.id, statement: "Exercitiul a fost șters din DB!" };
            // }

            exerciseHelper.addPreview(exercise, statementNumber, true);

            const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
            exercise.authorAndSource1 = authorAndSource1;
            exercise.source2 = source2;
        });

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
        res.render("sheet/sheet", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
    try {
        const sheets = await sheetService.getAll();

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

    const cartItems = cart ? JSON.parse(cart) : [];

    // let chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        let exercises = [];
        if (cartItems) {
            const allExercisesIds = (cartItems || []).map((x) => x.e);

            // // deduplicate exercisesIds
            // const allUniqueExercisesIds = [...new Set(allExercisesIds)];

            // get exercises from DB
            if (allExercisesIds.length > 0) {
                exercises = await exerciseService.getAllByIds(allExercisesIds);
            }

            // add preview
            exercises.forEach((exercise) => {
                const statementNumber = `**E.${exercise.code}.**`;

                // if (!exercise) {
                //     exercise = { _id: x.id, statement: "Exercitiul a fost șters din DB!" };
                // }

                exerciseHelper.addPreview(exercise, statementNumber, true);

                const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
                exercise.authorAndSource1 = authorAndSource1;
                exercise.source2 = source2;
            });
        }

        const data = {
            courseId,
            lessonId,
            exercises,
            // courseCode: course.code,
            // chapterId,
            // chapterIndex,
            // availablePositions,
            // selectedPosition,
        };

        //res.send(data);
        res.render("sheet/sheet-create", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createPost = async (req, res) => {
    const { courseId, lessonId, name, description, exerciseIdsInput } = req.body;
    let exerciseIds = [];

    // let lesson;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        if (exerciseIdsInput) exerciseIds = Array.isArray(exerciseIdsInput) ? exerciseIdsInput : [exerciseIdsInput];

        const sheet = {
            name,
            description,
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
        exercises.forEach((exercise) => {
            const statementNumber = `**E.${exercise.code}.**`;

            // if (!exercise) {
            //     exercise = { _id: x.id, statement: "Exercitiul a fost șters din DB!" };
            // }

            exerciseHelper.addPreview(exercise, statementNumber, true);

            const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
            exercise.authorAndSource1 = authorAndSource1;
            exercise.source2 = source2;
        });

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

        const { name, description, grade, category, isHidden, isActive } = req.body;

        const sheet = {
            _id: sheetId,
            name,
            description,
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
