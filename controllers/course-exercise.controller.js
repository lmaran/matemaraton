const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");

exports.createOrEditGet = async (req, res) => {
    const { courseId, chapterId, lessonId, sectionId, levelId, exerciseId } = req.params;

    const isEditMode = !!exerciseId;
    const exerciseInLesson = !!(courseId && chapterId && lessonId);

    const exerciseTypeAvailableOptions = [
        { text: "Cu răspuns deschis", value: "1" },
        { text: "Cu răspuns tip grilă (selecție unică)", value: "2" },
        { text: "Cu răspuns exact (tip numeric)", value: "3" },
    ];

    let lessonRef, courseCode, chapterIndex, positionOptions, selectedPosition, exercise;

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

        lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
        if (!lessonRef) return res.status(500).send("Lecție negăsită!");
        lessonRef.index = chapterRef.lessons.findIndex((x) => x.id === lessonId);

        // console.log(exerciseInLesson);
        // return;

        if (isEditMode) {
            exercise = await exerciseService.getOneById(exerciseId);

            if (exercise && exercise.question) {
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
            }
        } else {
            exercise = { exerciseType: 1 }; // Set 'open answer' as a default exercise type
        }

        const data = {
            isEditMode,

            courseId,
            chapterId,
            lessonId,
            sectionId,
            levelId,

            courseCode,
            chapterIndex,
            lesson: lessonRef,
            positionOptions,
            selectedPosition,
            exercise,
            exerciseTypeAvailableOptions,
            exerciseInLesson,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditPost = async (req, res) => {
    const {
        courseId,
        chapterId,
        lessonId,
        sectionId,
        levelId,

        id,
        grade,
        contestName,
        exerciseType,
        sourceName,
        author,
        statement,
        answer,
        solution,
        hints,
    } = req.body;

    const isEditMode = !!id;
    const exerciseInLesson = !!(courseId && chapterId && lessonId);

    if (exerciseInLesson) {
        if (!["1", "2"].includes(sectionId)) return res.status(500).send("Secțiune invalidă!");
        if (!["0", "1", "2", "3"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");
    }

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const exercise = {
            question: {
                statement: { text: statement },
                solution: { text: solution },
                answer: { text: answer },
            },
            grade,
            exerciseType,
            contestName,
            sourceName,
            author,
        };

        if (hints) {
            exercise.question.hints = [];
            if (Array.isArray(hints)) {
                hints.forEach((hint) => {
                    if (hint.trim()) {
                        exercise.question.hints.push({ text: hint.trim() });
                    }
                });
            } else {
                // an object with a single option
                if (hints.trim()) {
                    exercise.question.hints.push({ text: hints.trim() });
                }
            }
        }

        const answerOptions = req.body.answerOptions;
        if (answerOptions) {
            exercise.question.answerOptions = [];
            if (Array.isArray(answerOptions)) {
                answerOptions.forEach((answerOption, idx) => {
                    if (answerOption.trim()) {
                        const newAnswerOption = { text: answerOption.trim() };

                        // set isCorrectAnswer (if apply)
                        const isCorrectAnswerChecks = req.body.isCorrectAnswerChecks;
                        if (isCorrectAnswerChecks) {
                            if (Array.isArray(isCorrectAnswerChecks)) {
                                if (isCorrectAnswerChecks.includes(String(idx + 1))) {
                                    newAnswerOption.isCorrect = true;
                                }
                            } else {
                                if (isCorrectAnswerChecks === String(idx + 1)) {
                                    newAnswerOption.isCorrect = true;
                                }
                            }
                        }

                        exercise.question.answerOptions.push(newAnswerOption);
                    }
                });
            } else {
                // an object with a single option
                if (answerOptions.trim()) {
                    const newAnswerOption = { text: answerOptions.trim() };

                    // set isCorrectAnswer (if apply)
                    const isCorrectAnswerChecks = req.body.isCorrectAnswerChecks;
                    if (isCorrectAnswerChecks && isCorrectAnswerChecks === "1") {
                        newAnswerOption.isCorrect = true;
                    }
                    exercise.question.answerOptions.push(newAnswerOption);
                }
            }
        }

        if (isEditMode) {
            exercise._id = id;
            exerciseService.updateOne(exercise);
        } else {
            exercise.code = await idGeneratorMongoService.getNextId("exercises");
            const result = await exerciseService.insertOne(exercise);
            exercise._id = result.insertedId;
        }

        // add exercise to lesson
        if (exerciseInLesson && !isEditMode) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const chapter = (course.chapters || []).find((x) => x.id === chapterId);
            if (!chapter) return res.status(500).send("Capitol negăsit!");

            const lesson = (chapter.lessons || []).find((x) => x.id === lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            (lesson.exercises || []).push({
                sectionId,
                levelId,
                id: exercise._id.toString(),
            });
            courseService.updateOne(course);
        }

        //res.send(exercise);
        if (exerciseInLesson) {
            res.redirect(
                `/cursuri/${courseId}/capitole/${chapterId}/lectii/${lessonId}/modifica?sectionId=${sectionId}&levelId=${levelId}#section${sectionId}-level${levelId}`
            );
        } else {
            res.redirect(`/exercitii/${exercise._id}/modifica`);
        }
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { courseId, chapterId, lessonId, exerciseId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");

        const lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
        if (!lessonRef) return res.status(500).send("Lecție negăsită!");

        const exerciseRef = (lessonRef.exercises || []).find((x) => x.id === exerciseId);
        if (!exerciseRef) return res.status(500).send("Exercițiu negăsit!");

        const exerciseRefIndex = lessonRef.exercises.findIndex((x) => x.id === exerciseId);

        if (exerciseRefIndex > -1) {
            lessonRef.exercises.splice(exerciseRefIndex, 1); // remove from array

            const result = await courseService.updateOne(course);

            // delete also the exercise content
            if (result.modifiedCount == 1) exerciseService.deleteOneById(exerciseId);
        }

        const { sectionId, levelId } = exerciseRef;
        res.redirect(
            `/cursuri/${courseId}/capitole/${chapterId}/lectii/${lessonId}/modifica?sectionId=${sectionId}&levelId=${levelId}#section${sectionId}-level${levelId}`
        );
    } catch (err) {
        return res.status(500).json(err.message);
    }
};
