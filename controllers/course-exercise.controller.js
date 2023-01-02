const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const arrayHelper = require("../helpers/array.helper");

const { availableExerciseTypes, availableSections, availableLevels } = require("../constants/constants");

const hljs = require("highlight.js/lib/core");
hljs.registerLanguage("json", require("highlight.js/lib/languages/json"));

exports.getOneById = async (req, res) => {
    const { courseId, chapterId, lessonId, sectionId, levelId, exerciseId } = req.params;

    const isEditMode = !!exerciseId;
    const exerciseInLesson = !!(courseId && chapterId && lessonId);

    let lessonRef, courseCode, chapterIndex, availablePositions, selectedPosition, exercise;

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

        exercise = await exerciseService.getOneById(exerciseId);

        if (exercise && exercise.question) {
            const statement = `**E.${exercise.code}.** ${exercise.question.statement?.text}`;
            // const statement = `**[Problema ${++i}.](/exercitii/${exercise._id})** ${exercise.question.statement.text}`;

            exercise.question.statement.textPreview = markdownService.render(statement);

            if (exercise.question.answer && exercise.question.answer.text) {
                exercise.question.answer.textPreview = markdownService.render(exercise.question.answer.text);
            }

            if (exercise.question.solution && exercise.question.solution.text) {
                exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);
            }

            if (exercise.question.hints) {
                exercise.question.hints.forEach((hint, idx) => {
                    hint.textPreview = markdownService.render(`**Indicația ${idx + 1}:** ${hint.text}`);
                });
            }

            const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
            if (exercise.question.answerOptions) {
                exercise.question.answerOptions.forEach((answerOption, idx) => {
                    // insert a label (letter) in front of each option: "a" for the 1st option, "b" for the 2nd a.s.o.
                    answerOption.textPreview = markdownService.render(`${alphabet[idx]}) ${answerOption.text}`);
                    if (answerOption.isCorrect) {
                        exercise.question.correctAnswerPreview = markdownService.render(`**Răspuns:** ${answerOption.text}`);
                    }
                });
            }
        }

        exercise.exerciseType = availableExerciseTypes.find((x) => x.value == exercise.exerciseType);

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
            availablePositions,
            selectedPosition,
            exercise,
            availableExerciseTypes,
            exerciseInLesson,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditGet = async (req, res) => {
    const { courseId, chapterId, lessonId, sectionId, levelId, exerciseId } = req.params;

    const isEditMode = !!exerciseId;
    const exerciseInLesson = !!(courseId && chapterId && lessonId);

    let lessonRef, courseCode, chapterIndex, availablePositions, selectedPosition, exercise;

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

        if (isEditMode) {
            exercise = await exerciseService.getOneById(exerciseId);

            if (exercise && exercise.question) {
                if (exercise.question.statement && exercise.question.statement.text) {
                    exercise.question.statement.textPreview = markdownService.render(exercise.question.statement.text);
                }

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

        // sort exercises by sectionId, then by levelId
        const newExercises = (lessonRef.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.sectionId == sectionId && x.levelId == levelId);

        // in editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, exerciseId, true));

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
            availablePositions,
            selectedPosition,
            exercise,
            availableExerciseTypes,
            exerciseInLesson,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise-create-or-edit", data);
    } catch (err) {
        console.log(err);
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

        //grade,
        contestName,
        exerciseType,
        sourceName,
        author,
        statement,
        answer,
        answerOptions,
        isCorrectAnswerChecks,
        solution,
        hints,
        position,
    } = req.body;

    let { exerciseId } = req.body;
    const isEditMode = !!exerciseId;
    const exerciseInLesson = !!(courseId && chapterId && lessonId);

    let exercise;

    if (exerciseInLesson) {
        if (!["1", "2"].includes(sectionId)) return res.status(500).send("Secțiune invalidă!");
        if (!["1", "2", "3", "4"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");
    }

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        if (isEditMode) {
            exercise = await exerciseService.getOneById(exerciseId);
            if (!exercise) return res.status(500).send("Exercițiu negăsit!");
        } else {
            // new exercise
            exerciseId = courseService.getObjectId();
            exercise = {
                _id: exerciseId,
                code: await idGeneratorMongoService.getNextId("exercises"),
            };
        }

        exercise.question = {
            statement: { text: statement },
            solution: { text: solution },
            answer: { text: answer },
        };
        exercise.exerciseType = exerciseType;
        exercise.contestName = contestName;
        exercise.sourceName = sourceName;
        exercise.author = author;

        if (hints) exercise.question.hints = getHintsAsArray(hints);
        if (answerOptions) exercise.question.answerOptions = getAnswerOptionsAsArray(answerOptions, isCorrectAnswerChecks);

        if (isEditMode) await exerciseService.updateOne(exercise);
        else await exerciseService.insertOne(exercise);

        // add exercise to lesson
        if (exerciseInLesson) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            const chapter = (course.chapters || []).find((x) => x.id === chapterId);
            if (!chapter) return res.status(500).send("Capitol negăsit!");

            const lesson = (chapter.lessons || []).find((x) => x.id === lessonId);
            if (!lesson) return res.status(500).send("Lecție negăsită!");

            // TODO use the "addExerciseToLocation()" method
            const newExercise = {
                sectionId,
                levelId,
                id: exercise._id.toString(),
            };

            // sort exercises by sectionId, then by levelId
            const newExercises = (lesson.exercises || [])
                .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
                .filter((x) => x.sectionId == sectionId && x.levelId == levelId);

            arrayHelper.moveOrInsertAtIndex(newExercises, newExercise, "id", position);

            // remove all exercises within the current level
            lesson.exercises = (lesson.exercises || []).filter((x) => !(x.sectionId == sectionId && x.levelId == levelId));

            // add all the new exercises within the current level and sort the result
            lesson.exercises = (lesson.exercises || [])
                .concat(newExercises)
                .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId);

            courseService.updateOne(course);
        }

        //res.send(exercise);
        if (exerciseInLesson) {
            res.redirect(
                `/cursuri/${courseId}/capitole/${chapterId}/lectii/${lessonId}/sectiuni/${sectionId}/niveluri/${levelId}/exercitii/${exerciseId}/modifica`
            );
        } else {
            res.redirect(`/exercitii/${exercise._id}/modifica`);
        }
        //res.send(req.body);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.moveGet = async (req, res) => {
    const { courseId, chapterId, lessonId, sectionId, levelId, exerciseId } = req.params;

    const exerciseInLesson = !!(courseId && chapterId && lessonId);

    let lessonRef, courseCode, chapterIndex, availablePositions, selectedPosition;

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

        const exercise = await exerciseService.getOneById(exerciseId);

        let availableCourses = await courseService.getCoursesNames();
        availableCourses = availableCourses.map((c) => {
            c.name = `${c.code}: ${c.name};`;
            return c;
        });

        const availableLessons = [];
        (course.chapters || []).forEach((c) => {
            (c.lessons || []).forEach((l) => {
                availableLessons.push({
                    id: l.id,
                    name: l.name,
                });
            });
        });

        // sort exercises by sectionId, then by levelId
        const newExercises = (lessonRef.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.sectionId == sectionId && x.levelId == levelId);

        // in editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, exerciseId, true));

        const data = {
            availableCourses,
            courseId,

            availableLessons,
            lessonId,

            availableSections,
            sectionId,

            availableLevels,
            levelId,

            chapterId,

            courseCode,
            chapterIndex,
            lesson: lessonRef,
            availablePositions,
            selectedPosition,

            exerciseInLesson,
            exerciseId,
            exerciseCode: exercise.code,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise-move", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.movePost = async (req, res) => {
    //const { courseId, chapterId, lessonId, sectionId, levelId, exerciseId } = req.params;

    const {
        exerciseId,

        courseId: courseIdOld,
        chapterId: chapterIdOld,
        lessonId: lessonIdOld,
        sectionId: sectionIdOld,
        levelId: levelIdOld,
        positionId: positionIdOld,

        course: courseIdNew,
        chapter: chapterIdNew,
        lesson: lessonIdNew,
        section: sectionIdNew,
        level: levelIdNew,
        position: positionIdNew,
    } = req.body;

    const redirectUri = `/cursuri/${courseIdNew}/capitole/${
        chapterIdNew || chapterIdOld
    }/lectii/${lessonIdNew}/modifica?sectionId=${sectionIdNew}&levelId=${levelIdNew}#section${sectionIdNew}-level${levelIdNew}`;

    //console.log(req.body);

    // const exerciseInLesson = !!(courseId && chapterId && lessonId);

    // let lessonRef, courseCode, chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        // if nothing has changed, redirect
        if (lessonIdNew == lessonIdOld && sectionIdNew == sectionIdOld && levelIdNew == levelIdOld && positionIdNew == positionIdOld) {
            return res.redirect(redirectUri);
        }

        let isValid, message;
        ({ isValid, message } = await removeExerciseFromLocation(courseIdOld, exerciseId));

        // remove the exercise from the old location
        if (!isValid) return res.status(500).send(message);

        // add the exercise to the new location
        ({ isValid, message } = await addExerciseToLocation(courseIdNew, lessonIdNew, sectionIdNew, levelIdNew, positionIdNew, exerciseId));
        if (!isValid) return res.status(500).send(message);

        // const data = {
        //     exerciseId,

        //     courseIdOld,
        //     chapterIdOld,
        //     lessonIdOld,
        //     sectionIdOld,
        //     levelIdOld,
        //     positionIdOld,

        //     courseIdNew,
        //     chapterIdNew,
        //     lessonIdNew,
        //     sectionIdNew,
        //     levelIdNew,
        //     positionIdNew,
        // };

        // res.send(data);
        res.redirect(redirectUri);
        //res.render("course-exercise/course-exercise-move", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAvailableLessons = async (req, res) => {
    const { courseId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const availableLessons = [];
        (course.chapters || []).forEach((c) => {
            (c.lessons || []).forEach((l) => {
                availableLessons.push({
                    id: l.id,
                    name: l.name,
                });
            });
        });

        const data = {
            availableLessons,
        };

        res.send(data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAvailablePositions = async (req, res) => {
    const { courseId, lessonId, sectionId, levelId, exerciseId } = req.params;
    let lessonRef, availablePositions;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        for (const chapterRef of course.chapters || []) {
            lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
            if (lessonRef) break;
        }
        if (!lessonRef) return res.status(500).send("Lecție negăsită!");

        // sort exercises by sectionId, then by levelId
        const newExercises = (lessonRef.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.sectionId == sectionId && x.levelId == levelId);

        // in editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions } = arrayHelper.getAvailablePositions(newExercises, exerciseId, true));

        const data = {
            availablePositions,
        };

        res.send(data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.jsonGet = async (req, res) => {
    const { courseId, chapterId, lessonId, sectionId, levelId, exerciseId } = req.params;

    let lessonRef, courseCode, chapterIndex, lessonIndex, exercise;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        exercise = await exerciseService.getOneById(exerciseId);

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");
        courseCode = course.code;

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");
        chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
        if (!lessonRef) return res.status(500).send("Lecție negăsită!");
        lessonIndex = chapterRef.lessons.findIndex((x) => x.id === lessonId);

        // 1. format (indent, new lines)
        // it requires <pre>, <code> and 2 curly braces: "<pre><code>{{formattedExercise}}</code></pre>""
        const formattedExercise = JSON.stringify(exercise, null, 4);

        // 2. highlight (inject html tags in order to support colors, borders etc)
        // it requires <pre>, <code> and 3 curly braces: "<pre><code>{{prettyExercise}}</code></pre>""
        const prettyExercise = hljs.highlight(formattedExercise, { language: "json" }).value;

        const data = {
            courseId,
            chapterId,
            lessonId,
            sectionId,
            levelId,

            courseCode,
            chapterIndex,
            lessonIndex,

            exercise,
            //formattedExercise,
            prettyExercise,
        };

        //res.send(data);

        res.render("course-exercise/course-exercise-json", data);
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

const getHintsAsArray = (hints) => {
    const hintsAsArray = [];
    if (Array.isArray(hints)) {
        hints.forEach((hint) => {
            hint = hint.trim();
            if (hint) hintsAsArray.push({ text: hint });
        });
    } else {
        // an object with a single option
        const hint = hints.trim();
        if (hint) hintsAsArray.push({ text: hint });
    }
    return hintsAsArray;
};

const getAnswerOptionsAsArray = (answerOptions, isCorrectAnswerChecks) => {
    const answerOptionsAsArray = [];
    if (Array.isArray(answerOptions)) {
        answerOptions.forEach((answerOption, idx) => {
            answerOption = answerOption.trim();
            if (answerOption) {
                const newAnswerOption = { text: answerOption };

                // set isCorrectAnswer (if apply)
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

                answerOptionsAsArray.push(newAnswerOption);
            }
        });
    } else {
        // an object with a single option
        const answerOptions = answerOptions.trim();
        if (answerOptions) {
            const newAnswerOption = { text: answerOptions };

            // set isCorrectAnswer (if apply)
            if (isCorrectAnswerChecks && isCorrectAnswerChecks === "1") {
                newAnswerOption.isCorrect = true;
            }
            answerOptionsAsArray.push(newAnswerOption);
        }
    }
    return answerOptionsAsArray;
};

const removeExerciseFromLocation = async (courseId, exerciseId) => {
    const course = await courseService.getOneById(courseId);
    if (!course) return { isValid: false, message: "Curs negăsit!" };

    let updateResult,
        found = false;

    for (const chapter of course.chapters || []) {
        for (const lesson of chapter.lessons || []) {
            const exerciseIndex = (lesson.exercises || []).findIndex((x) => x.id == exerciseId);

            if (exerciseIndex > -1) {
                found = true;
                // remove exercise and save to DB
                lesson.exercises.splice(exerciseIndex, 1);
                updateResult = await courseService.updateOne(course);

                break;
            }
        }
        if (found) break;
    }

    if (!found) return { isValid: false, message: "Exercițiu negăsit!" };
    if (updateResult.modifiedCount != 1) return { isValid: false, message: "Eroare la salvarea în DB!" };

    return { isValid: true };
};

const addExerciseToLocation = async (courseId, lessonId, sectionId, levelId, positionId, exerciseId) => {
    const course = await courseService.getOneById(courseId);
    if (!course) return { isValid: false, message: "Curs negăsit!" };

    let updateResult,
        lessonFound = false;

    for (const chapter of course.chapters || []) {
        const lesson = (chapter.lessons || []).find((l) => l.id == lessonId);
        if (lesson) {
            lessonFound = true;

            const newExercise = {
                sectionId,
                levelId,
                id: exerciseId,
            };

            // sort exercises by sectionId, then by levelId
            const newExercises = (lesson.exercises || [])
                .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
                .filter((x) => x.sectionId == sectionId && x.levelId == levelId);

            arrayHelper.moveOrInsertAtIndex(newExercises, newExercise, "id", positionId);

            // remove all exercises within the current level
            lesson.exercises = (lesson.exercises || []).filter((x) => !(x.sectionId == sectionId && x.levelId == levelId));

            // add all the new exercises within the current level and sort the result
            lesson.exercises = (lesson.exercises || [])
                .concat(newExercises)
                .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId);

            updateResult = await courseService.updateOne(course);

            break;
        }
    }

    if (!lessonFound) return { isValid: false, message: "Lecție negăsită!" };
    if (updateResult.modifiedCount != 1) return { isValid: false, message: "Eroare la salvarea în DB!" };

    return { isValid: true };
};
