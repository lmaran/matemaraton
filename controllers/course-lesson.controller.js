const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");

const { availableSections, availableLevels } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { courseId, chapterId, lessonId } = req.params;

    try {
        // validate parameters
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");

        const lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
        if (!lessonRef) return res.status(500).send("Lecție negăsită!");

        const courseCode = course.code;
        const chapterIndex = (course.chapters || []).findIndex((x) => x.id === chapterId);
        const lessonIndex = chapterRef.lessons.findIndex((x) => x.id === lessonId);

        if (lessonRef.theory) {
            lessonRef.theory.textPreview = markdownService.render(lessonRef.theory.text);
        }

        const exercisesFromDb = await getAllExercisesInLesson(lessonRef);

        lessonRef.sectionsObj = getSectionsObj(lessonRef.exercises, exercisesFromDb, true);

        // remove unnecessary fields
        if (lessonRef.theory) delete lessonRef.theory.text;
        delete lessonRef.exercises;

        const data = {
            lesson: lessonRef,
            courseId,
            courseCode,
            chapterId,
            chapterIndex,
            lessonId,
            lessonIndex,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        //res.send(data);
        res.render("course-lesson/course-lesson", data);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.createOrEditGet = async (req, res) => {
    const { courseId, chapterId, lessonId } = req.params;
    const { sectionId, levelId } = req.query;

    const isEditMode = !!lessonId;

    let lessonRef, courseCode, chapterIndex, lessonIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");
        courseCode = course.code;

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");
        chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        if (isEditMode) {
            lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
            if (!lessonRef) return res.status(500).send("Lecție negăsită!");

            lessonIndex = chapterRef.lessons.findIndex((x) => x.id === lessonId);

            if (lessonRef.theory) {
                lessonRef.theory.textPreview = markdownService.render(lessonRef.theory.text);
            }

            const exercisesFromDb = await getAllExercisesInLesson(lessonRef);

            lessonRef.sectionsObj = getSectionsObj(lessonRef.exercises, exercisesFromDb, true);

            setActivelLevel(lessonRef.sectionsObj, sectionId, levelId);

            // remove unnecessary fields
            delete lessonRef.exercises;
        }
        // in editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(chapterRef.lessons, lessonId));

        const data = {
            isEditMode,
            courseId,
            courseCode,
            chapterId,
            chapterIndex,
            lesson: lessonRef,
            lessonId,
            lessonIndex,
            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("course-lesson/course-lesson-create-or-edit", data);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.createOrEditPost = async (req, res) => {
    const { courseId, chapterId, name, description, isHidden, position, theory } = req.body;
    let { lessonId } = req.params;
    const isEditMode = !!lessonId;

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

        if (isEditMode) {
            lesson = (chapterRef.lessons || []).find((x) => x.id === lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");
        } else {
            // new lesson
            lessonId = courseService.getObjectId().toString();
            lesson = {
                id: lessonId,
            };
        }

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

        chapterRef.lessons = chapterRef.lessons || [];

        arrayHelper.moveOrInsertAtIndex(chapterRef.lessons, lesson, "id", position);

        courseService.updateOne(course);

        res.redirect(`/cursuri/${courseId}/capitole/${chapterId}/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { courseId, chapterId, lessonId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");

        const lessonIndex = chapterRef.lessons.findIndex((x) => x.id === lessonId);
        if (lessonIndex > -1) {
            //const lesson = lessons[lessonIndex];

            // TODO fix it (delete only empty lessons)
            // if (lesson.lessons && chapter.lessons.length > 0) {
            //     return res.status(403).send("Șterge întâi lecțiile!");
            // }

            chapterRef.lessons.splice(lessonIndex, 1); // remove from array
            courseService.updateOne(course);
        }

        res.redirect(`/cursuri/${courseId}/capitole/${chapterId}/modifica`);
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

    const exercises = exercisesRef.map((x, idx) => {
        let exercise = exercisesFromDb.find((y) => y._id.toString() === x.id);
        // add preview
        //const statementNumber = `**[R.${++idx}](/exercitii/${exercise._id})**`;
        // const statementNumber = x.sectionId == 1 ? `**R${++idx}.**&nbsp;` : `**P${++idx}.**&nbsp;`;

        const statementNumber = `**Problema ${++idx}.**`;
        if (!exercise) {
            exercise = { _id: x.id, question: { statement: { text: "Exercitiul a fost șters din DB!" } } };
        }
        exerciseHelper.addPreview(exercise, statementNumber, clear);
        return exercise;
    });

    exercisesRef.forEach((e) => {
        const exercise = exercises.find((x) => x._id.toString() === e.id);

        // row1 = authorAndSource1 = "<Author>, <ContestName>"
        // row2 = source2 = "<SourceName>"
        // If <ContestName> is not present, we will put "<SourceName>" on row1
        if (exercise.author) {
            exercise.authorAndSource1 = exercise.author;
            if (exercise.contestName) {
                exercise.authorAndSource1 = `${exercise.authorAndSource1}, ${exercise.contestName}`;
                exercise.source2 = exercise.sourceName;
            } else if (exercise.sourceName) {
                exercise.authorAndSource1 = `${exercise.authorAndSource1}, ${exercise.sourceName}`;
            }
        } else if (exercise.contestName) {
            exercise.authorAndSource1 = exercise.contestName;
            exercise.source2 = exercise.sourceName;
        } else {
            exercise.authorAndSource1 = exercise.sourceName;
        }

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

const setActivelLevel = (sectionsObj, activeSectionId, activeLevelId) => {
    sectionsObj.sections.forEach((section) => {
        if (section.id == activeSectionId) {
            section.levels.forEach((level) => {
                if (level.id == activeLevelId) level.isActive = true;
            });
        }
    });
};
