const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");
const lessonHelper = require("../helpers/lesson.helper");
const sheetService = require("../services/sheet.service");
const dateTimeHelper = require("../helpers/date-time.helper");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

const { availableSections, availableLevels } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { courseId, lessonId } = req.params;
    const { sectionId } = req.query;

    try {
        // validate parameters
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        if (lesson.theory) {
            lesson.theory.textPreview = markdownService.render(lesson.theory.text);
        }

        const exercisesFromDb = await getAllExercisesInLesson(lesson);

        lesson.sectionsObj = getSectionsObj(lesson.exercises, exercisesFromDb, true);

        setActiveSection(lesson.sectionsObj, sectionId);

        // remove unnecessary fields
        if (lesson.theory) delete lesson.theory.text;
        delete lesson.exercises;

        lesson.sheets = lesson.sheetIds ? await sheetService.getAllByIds(lesson.sheetIds) : [];

        lesson.sheets.forEach((sheet) => (sheet.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(sheet.createdOn))); // ex: 22.11.2023

        const data = {
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lesson,
            lessonId,
            lessonIndex,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `${lesson.name}`,
            user: req.user,
        };

        //res.send(data);
        res.render("course-lesson/course-lesson", data);
    } catch (err) {
        //console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.jsonGetOneById = async (req, res) => {
    const { courseId, lessonId } = req.params;

    try {
        // validate parameters
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        // keep only the current chapter and current lesson
        chapter.lessons = chapter.lessons.filter((x) => x.id == lesson.id);
        course.chapters = course.chapters.filter((x) => x.id == chapter.id);

        const courseLessonAsPrettyJson = prettyJsonHelper.getPrettyJson(course);

        const data = {
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId,
            lessonIndex,

            courseLessonAsPrettyJson,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `${lesson.name}`,
        };

        //res.send(data);
        res.render("course-lesson/course-lesson-json", data);
    } catch (err) {
        //console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.createGet = async (req, res) => {
    const { courseId, chapterId } = req.params;

    let chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapter = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapter) return res.status(500).send("Capitol negăsit!");
        chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(chapter.lessons, undefined));

        const data = {
            courseId,
            courseCode: course.code,

            chapterId,
            chapterIndex,

            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("course-lesson/course-lesson-create-or-edit", data);
    } catch (err) {
        //console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.createPost = async (req, res) => {
    const { courseId, chapterId, name, description, isHidden, position, theory } = req.body;
    let { lessonId } = req.params;

    let lesson;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");

        lessonId = courseService.getObjectId().toString();
        lesson = {
            id: lessonId,
        };

        // update lesson fields
        lesson.name = name;
        lesson.description = description;
        if (theory)
            lesson.theory = {
                text: theory.trim(),
            };

        if (isHidden === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            lesson.isHidden = true;
        } else delete lesson.isHidden;

        chapterRef.lessons = chapterRef.lessons || [];

        arrayHelper.moveOrInsertAtIndex(chapterRef.lessons, lesson, "id", position);

        courseService.updateOne(course);

        res.redirect(`/cursuri/${courseId}/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editGet = async (req, res) => {
    const { courseId, lessonId } = req.params;
    const { sectionId } = req.query;

    let availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        if (lesson.theory) {
            lesson.theory.textPreview = markdownService.render(lesson.theory.text);
        }

        const exercisesFromDb = await getAllExercisesInLesson(lesson);

        lesson.sectionsObj = getSectionsObj(lesson.exercises, exercisesFromDb, true);

        setActiveSection(lesson.sectionsObj, sectionId);

        // remove unnecessary fields
        delete lesson.exercises;

        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(chapter.lessons, lessonId));

        lesson.sheets = lesson.sheetIds ? await sheetService.getAllByIds(lesson.sheetIds) : [];

        lesson.sheets.forEach((sheet) => (sheet.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(sheet.createdOn))); // ex: 22.11.2023

        const data = {
            isEditMode: true,
            courseId,
            courseCode: course.code,
            chapterId: chapter.id,
            chapterIndex,
            lesson,
            lessonId,
            lessonIndex,
            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("course-lesson/course-lesson-create-or-edit", data);
    } catch (err) {
        //console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.editPost = async (req, res) => {
    const { courseId, name, description, isHidden, position, theory } = req.body;
    const { lessonId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, lesson } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        // update lesson fields
        lesson.name = name;
        lesson.description = description;
        lesson.theory = {
            text: theory.trim(),
        };

        if (isHidden === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            lesson.isHidden = true;
        } else delete lesson.isHidden;

        chapter.lessons = chapter.lessons || [];

        arrayHelper.moveOrInsertAtIndex(chapter.lessons, lesson, "id", position);

        courseService.updateOne(course);

        res.redirect(`/cursuri/${courseId}/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { courseId, lessonId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, lessonIndex } = lessonHelper.getLessonAndParentsFromCourse(course, lessonId);

        if (lessonIndex > -1) {
            //const lesson = lessons[lessonIndex];

            // TODO fix it (delete only empty lessons)
            // if (lesson.lessons && chapter.lessons.length > 0) {
            //     return res.status(403).send("Șterge întâi lecțiile!");
            // }

            chapter.lessons.splice(lessonIndex, 1); // remove from array
            courseService.updateOne(course);
        }

        res.redirect(`/cursuri/${courseId}/capitole/${chapter.id}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

// Get all unique exercises in a lesson
const getAllExercisesInLesson = async (lesson) => {
    let allExercises = [];
    const allExercisesIds = (lesson.exercises || []).map((x) => x.id);

    // deduplicate exercisesIds
    const allUniqueExercisesIds = [...new Set(allExercisesIds)];

    // get exercises from DB
    if (allUniqueExercisesIds.length > 0) {
        allExercises = await exerciseService.getAllByIds(allUniqueExercisesIds);
    }

    return allExercises;
};

//  exercisesRef: [
//     { id: '5f4636cd17efad83f707e937', sectionId:1, level: 1 },
//     { id: '5f47d415eb57b91c67e5367d', sectionId:1, level: 1 },
//     { id: '5f47dec6eb57b91c67e5367e', sectionId:1, level: 2 }]
const getSectionsObj = (exercisesRef, exercisesFromDb, clear) => {
    // initialize the section backbone (we need all sections and levels in editMode)
    const sections = [];
    availableSections.forEach((s) => {
        s.total = 0;
        s.levels = [];
        availableLevels.forEach((l) => {
            s.levels.push({
                id: l.id,
                name: l.name,
                total: 0,
                exercises: [],
            });
        });
        sections.push(s);
    });

    const sectionsObj = {
        total: 0,
        sections: sections,
    };

    if (!exercisesRef) return sectionsObj;

    // sort exercises by sectionId, then by levelId
    exercisesRef.sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId);

    const exercises = exercisesRef.map((x) => {
        let exercise = exercisesFromDb.find((y) => y._id.toString() === x.id);
        // add preview
        const statementNumber = `**E.${exercise.code}.**`;

        if (!exercise) {
            exercise = { _id: x.id, statement: "Exercitiul a fost șters din DB!" };
        }
        exerciseHelper.addPreview(exercise, statementNumber, clear);
        return exercise;
    });

    exercisesRef.forEach((e) => {
        const exercise = exercises.find((x) => x._id.toString() === e.id);

        const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
        exercise.authorAndSource1 = authorAndSource1;
        exercise.source2 = source2;

        const section = sectionsObj.sections.find((s) => s.id == e.sectionId);

        if (section) {
            const level = section.levels.find((l) => l.id == e.levelId);
            if (level) {
                level.exercises.push(exercise);
                level.total++;
                section.total++;
                sectionsObj.total++;
            }
        }
    });

    return sectionsObj;
};

const setActiveSection = (sectionsObj, activeSectionId) => {
    sectionsObj.sections.forEach((section) => {
        if (section.id == activeSectionId) {
            section.isActive = true;
        }
    });
};
