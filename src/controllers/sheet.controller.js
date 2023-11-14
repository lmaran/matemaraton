//const courseService = require("../services/course.service");
const sheetService = require("../services/sheet.service");
const autz = require("../services/autz.service");
//const arrayHelper = require("../helpers/array.helper");
//const markdownService = require("../services/markdown.service");
//const exerciseHelper = require("../helpers/exercise.helper");

//const prettyJsonHelper = require("../helpers/pretty-json.helper");

//const { availableSections, availableLevels } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { sheetId } = req.params;
    //const { sectionId } = req.query;
    try {
        // validate parameters
        const sheet = await sheetService.getOneById(sheetId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

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
    // const { courseId, chapterId } = req.params;

    // let chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        // const course = await courseService.getOneById(courseId);
        // if (!course) return res.status(500).send("Curs negăsit!");

        // const chapter = (course.chapters || []).find((x) => x.id === chapterId);
        // if (!chapter) return res.status(500).send("Capitol negăsit!");
        // chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        // ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(chapter.lessons, undefined));

        const data = {
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
    const { courseId, chapterId, name, description, isHidden, position, theory } = req.body;
    // let { sheetId } = req.params;

    // let lesson;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-update:sheet");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        // const course = await courseService.getOneById(courseId);
        // if (!course) return res.status(500).send("Curs negăsit!");
        // const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        // if (!chapterRef) return res.status(500).send("Capitol negăsit!");

        const sheet = {
            name,
            description,
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
        // if (!course) return res.status(500).send("Curs negăsit!");

        // const chapter = (course.chapters || []).find((x) => x.id === chapterId);
        // if (!chapter) return res.status(500).send("Capitol negăsit!");
        // chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        // ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(chapter.lessons, undefined));

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
        res.redirect("/fise");
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
