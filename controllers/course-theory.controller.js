const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");

const { availableSections, availableLevels } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { courseId, lessonId } = req.params;
    const { sectionId, levelId } = req.query;

    try {
        // validate parameters
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex } = getLessonAndParentsFromCourse(course, lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        if (lesson.theory) {
            lesson.theory.textPreview = markdownService.render(lesson.theory.text);
        }

        const exercisesFromDb = await getAllExercisesInLesson(lesson);

        lesson.sectionsObj = getSectionsObj(lesson.exercises, exercisesFromDb, true);

        setActivelLevel(lesson.sectionsObj, sectionId, levelId);

        // remove unnecessary fields
        if (lesson.theory) delete lesson.theory.text;
        delete lesson.exercises;

        const data = {
            courseId,
            courseCode: course.code,
            courseName: course.name,
            courseCategory: course.category,

            chapterId: chapter.id,
            chapterIndex,

            lesson,
            lessonId,
            lessonIndex,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `${lesson.name}`,
        };

        //res.send(data);
        res.render("course-theory/course-theory", data);
    } catch (err) {
        //console.log(err);
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

const setActivelLevel = (sectionsObj, activeSectionId, activeLevelId) => {
    sectionsObj.sections.forEach((section) => {
        if (section.id == activeSectionId) {
            section.levels.forEach((level) => {
                if (level.id == activeLevelId) level.isActive = true;
            });
        }
    });
};

const getLessonAndParentsFromCourse = (course, lessonId) => {
    let chapter;
    let chapterIndex = -1;
    let lesson;
    let lessonIndex = -1;

    const chapters = course.chapters || [];
    for (let i = 0; i < chapters.length; i++) {
        const lessons = chapters[i].lessons || [];

        for (let j = 0; j < lessons.length; j++) {
            if (lessons[j].id == lessonId) {
                lesson = lessons[j];
                lessonIndex = j;
                break;
            }
        }

        if (lesson) {
            chapter = chapters[i];
            chapterIndex = i;
            break;
        }
    }

    return {
        chapter,
        chapterIndex,
        lesson,
        lessonIndex,
    };
};
