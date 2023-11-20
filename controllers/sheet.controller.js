//const courseService = require("../services/course.service");
const sheetService = require("../services/sheet.service");
const autz = require("../services/autz.service");
const exerciseService = require("../services/exercise.service");
//const arrayHelper = require("../helpers/array.helper");
//const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");

//const prettyJsonHelper = require("../helpers/pretty-json.helper");

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

        // const { chapter, chapterIndex, lesson, lessonIndex } = getLessonAndParentsFromCourse(course, lessonId);
        // if (!lesson) return res.status(500).send("Lecție negăsită!");

        // if (lesson.theory) {
        //     lesson.theory.textPreview = markdownService.render(lesson.theory.text);
        // }

        // const exercisesFromDb = await getAllExercisesInLesson(lesson);

        // lesson.sectionsObj = getSectionsObj(lesson.exercises, exercisesFromDb, true);

        // setActiveSection(lesson.sectionsObj, sectionId);

        // // remove unnecessary fields
        // if (lesson.theory) delete lesson.theory.text;
        // delete lesson.exercises;

        const data = {
            sheet,
            // courseId,
            // courseCode: course.code,

            // chapterId: chapter.id,
            // chapterIndex,

            // lesson,
            // lessonId,
            // lessonIndex,

            // canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            // pageTitle: `${lesson.name}`,
        };

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
            exercises,
            // courseId,
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
    const { name, description, exerciseIdsInput } = req.body;
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

        res.redirect(`/fise/${result.insertedId}`);
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

    // const sheet = await courseService.getOneById(courseId);
    // if (course.chapters && course.chapters.length > 0) {
    //     return res.status(403).send("Șterge întâi capitolele!");
    // }

    sheetService.deleteOneById(sheetId);
    res.redirect(`/fise`);
};
