const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;
    const exerciseId = req.params.exerciseId;

    // we need sectionId and levelId just for UI (to show the current section/level)
    const sectionId = req.params.sectionId;
    const levelId = req.params.levelId;

    const exerciseTypeAvailableOptions = [
        { text: "Cu răspuns deschis", value: "1" },
        { text: "Cu răspuns tip grilă (selecție unică)", value: "2" },
        { text: "Cu răspuns exact (tip numeric)", value: "3" },
    ];

    // const activeSection = req.query.section;
    // const activeLevel = req.query.level;

    const isEditMode = !!exerciseId;

    let lessonRef, courseCode, chapterIndex, positionOptions, selectedPosition, exercise;

    try {
        const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
        if (!canCreateOrEditExercise) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");
        courseCode = course.code;

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");
        chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
        if (!lessonRef) return res.status(500).send("Lecție negăsită!");
        lessonRef.index = chapterRef.lessons.findIndex((x) => x.id === lessonId);

        if (isEditMode) {
            const exercise = await exerciseService.getOneById(req.params.id);

            exercise.question.statement.textPreview = markdownService.render(exercise.question.statement.text);
            if (exercise.question.answer && exercise.question.answer.text) {
                exercise.question.answer.textPreview = markdownService.render(exercise.question.answer.text);
            }

            if (exercise.question.solution && exercise.question.solution.text) {
                exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);
            }

            if (exercise.question.hints) {
                exercise.question.hints.forEach((hint) => {
                    hint.textPreview = markdownService.render(hint.text);
                });
            }

            if (exercise.question.answerOptions) {
                exercise.question.answerOptions.forEach((answerOption) => {
                    answerOption.textPreview = markdownService.render(answerOption.text);
                });
            }
        } else {
            exercise = { exerciseType: 1 }; // Set 'open answer' as a default exercise type
        }

        const data = {
            isEditMode,
            courseId,
            courseCode,
            chapterId,
            chapterIndex,
            lesson: lessonRef,
            sectionId,
            levelId,
            positionOptions,
            selectedPosition,
            exercise,
            exerciseTypeAvailableOptions,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};
