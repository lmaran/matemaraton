const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const arrayHelper = require("../helpers/array.helper");
const exerciseHelper = require("../helpers/exercise.helper");

const { availableExerciseTypes, availableSections, availableLevels } = require("../constants/constants");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.getOneById = async (req, res) => {
    const { courseId, exerciseId } = req.params;
    let availablePositions, selectedPosition, exercise;

    try {
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex, exerciseMeta } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);

        const statementNumber = `**E.${exercise.code}.**`;
        exerciseHelper.addPreview(exercise, statementNumber, true);

        const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
        exercise.authorAndSource1 = authorAndSource1;
        exercise.source2 = source2;

        exercise.exerciseType = availableExerciseTypes.find((x) => x.value == exercise.exerciseType);

        const data = {
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId: lesson.id,
            lessonIndex,

            sectionId: exerciseMeta.sectionId,
            levelId: exerciseMeta.levelId,

            exercise,

            availablePositions,
            selectedPosition,
            availableExerciseTypes,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `E.${exercise.code}`,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createGet = async (req, res) => {
    const { courseId, chapterId, lessonId, sectionId, levelId } = req.params;

    let lesson, chapterIndex, availablePositions, selectedPosition, exercise;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");
        chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

        lesson = (chapterRef.lessons || []).find((x) => x.id === lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");
        lesson.index = chapterRef.lessons.findIndex((x) => x.id === lessonId);

        exercise = { exerciseType: 1 }; // Set 'open answer' as the default exercise type

        // sort exercises by sectionId, then by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.sectionId == sectionId && x.levelId == levelId);

        // in editMode, exerciseId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, undefined, true));

        const data = {
            isEditMode: false,

            courseId,
            courseCode: course.code,

            chapterId,
            chapterIndex,

            lessonId,
            lessonIndex: lesson.index,

            sectionId,
            levelId,

            exercise,

            availablePositions,
            selectedPosition,
            availableExerciseTypes,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createPost = async (req, res) => {
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
        files,
        position,
    } = req.body;

    let { exerciseId } = req.body;

    let exercise;

    if (!["1", "2"].includes(sectionId)) return res.status(500).send("Secțiune invalidă!");
    if (!["1", "2", "3", "4"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        exerciseId = courseService.getObjectId();
        exercise = {
            _id: exerciseId,
            code: await idGeneratorMongoService.getNextId("exercises"),
        };

        exercise.statement = statement;
        exercise.solution = solution;
        exercise.answer = answer;
        exercise.exerciseType = exerciseType;
        exercise.contestName = contestName;
        exercise.sourceName = sourceName;
        exercise.author = author;

        if (hints) exercise.hints = getHintsAsArray(hints);
        if (files) exercise.files = getFilesAsArray(files);
        if (answerOptions) exercise.answerOptions = getAnswerOptionsAsArray(answerOptions, isCorrectAnswerChecks);

        await exerciseService.insertOne(exercise);

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

        res.redirect(`/cursuri/${courseId}/exercitii/${exerciseId}/modifica`);

        //res.send(req.body);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editGet = async (req, res) => {
    const { courseId, exerciseId } = req.params;

    let availablePositions, selectedPosition, exercise;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex, exerciseMeta } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);

        exercise = await exerciseService.getOneById(exerciseId);

        if (exercise) {
            if (exercise.statement) {
                exercise.statementPreview = markdownService.render(exercise.statement);
            }

            if (exercise.answer) {
                exercise.answerPreview = markdownService.render(exercise.answer);
            }

            if (exercise.solution) {
                exercise.solutionPreview = markdownService.render(exercise.solution);
            }
            if (exercise.hints) {
                exercise.hints.forEach((hint) => {
                    hint.textPreview = markdownService.render(hint.text);
                });
            }

            if (exercise.answerOptions) {
                exercise.answerOptions.forEach((answerOption) => {
                    answerOption.textPreview = markdownService.render(answerOption.text);
                });
            }
        }

        // sort exercises by sectionId, then by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.sectionId - exerciseB.sectionId || exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.sectionId == exerciseMeta.sectionId && x.levelId == exerciseMeta.levelId);

        // in editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, exerciseId, true));

        const data = {
            isEditMode: true,

            courseId: course._id,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId: lesson.id,
            lessonIndex,

            sectionId: exerciseMeta.sectionId,
            levelId: exerciseMeta.levelId,

            availablePositions,
            selectedPosition,
            exercise,
            availableExerciseTypes,
        };

        //res.send(data);
        res.render("course-exercise/course-exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editPost = async (req, res) => {
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
        files,
        position,
    } = req.body;

    const { exerciseId } = req.body;

    let exercise;

    if (!["1", "2"].includes(sectionId)) return res.status(500).send("Secțiune invalidă!");
    if (!["1", "2", "3", "4"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        // const course = await courseService.getOneById(courseId);
        // if (!course) return res.status(500).send("Curs negăsit!");

        //const { chapter, chapterIndex, lesson, lessonIndex, exerciseMeta } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);

        exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        exercise.statement = statement;
        exercise.solution = solution;
        exercise.answer = answer;

        exercise.exerciseType = exerciseType;
        exercise.contestName = contestName;
        exercise.sourceName = sourceName;
        exercise.author = author;

        if (hints) exercise.hints = getHintsAsArray(hints);
        if (files) exercise.files = getFilesAsArray(files);
        if (answerOptions) exercise.answerOptions = getAnswerOptionsAsArray(answerOptions, isCorrectAnswerChecks);

        await exerciseService.updateOne(exercise);

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

        res.redirect(`/cursuri/${courseId}/exercitii/${exerciseId}/modifica`);

        //res.send(req.body);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err.message);
    }
};

exports.moveGet = async (req, res) => {
    const { courseId, exerciseId } = req.params;

    let availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex, exerciseMeta } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);
        const { sectionId, levelId } = exerciseMeta;

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
        const newExercises = (lesson.exercises || [])
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
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId: lesson.id,
            lessonIndex,

            exerciseId,
            exerciseCode: exercise.code,

            sectionId,
            levelId,

            availablePositions,
            selectedPosition,

            availableCourses,
            availableLessons,
            availableSections,
            availableLevels,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
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
        lessonId: lessonIdOld,
        sectionId: sectionIdOld,
        levelId: levelIdOld,
        positionId: positionIdOld,

        course: courseIdNew,
        lesson: lessonIdNew,
        section: sectionIdNew,
        level: levelIdNew,
        position: positionIdNew,
    } = req.body;

    const redirectUri = `/cursuri/${courseIdNew}/lectii/${lessonIdNew}/modifica?sectionId=${sectionIdNew}#section${sectionIdNew}`;

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
    const { courseId, exerciseId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lesson, lessonIndex, exerciseMeta } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);

        const exercise = await exerciseService.getOneById(exerciseId);

        const exerciseAsPrettyJson = prettyJsonHelper.getPrettyJson(exercise);

        const data = {
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId: lesson.id,
            lessonIndex,

            sectionId: exerciseMeta.sectionId,
            levelId: exerciseMeta.levelId,

            exerciseId: exerciseId,
            exerciseCode: exercise.code,

            exerciseAsPrettyJson,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        //res.send(data);

        res.render("course-exercise/course-exercise-json", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { courseId, exerciseId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { lesson, exerciseMeta, exerciseIndex } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);

        if (exerciseIndex > -1) {
            lesson.exercises.splice(exerciseIndex, 1); // remove from array

            const result = await courseService.updateOne(course);

            // delete also the exercise content
            if (result.modifiedCount == 1) exerciseService.deleteOneById(exerciseId);
        }

        const { sectionId } = exerciseMeta;
        res.redirect(`/cursuri/${courseId}/lectii/${lesson.id}/modifica?sectionId=${sectionId}#section${sectionId}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

const getHintsAsArray = (hints) => {
    const array = [];
    if (Array.isArray(hints)) {
        hints.forEach((hint) => {
            hint = hint.trim();
            if (hint) array.push({ text: hint });
        });
    } else {
        // an object with a single option
        const hint = hints.trim();
        if (hint) array.push({ text: hint });
    }
    return array;
};

const getFilesAsArray = (files) => {
    const array = [];
    if (Array.isArray(files)) {
        files.forEach((file) => {
            file = file.trim();
            if (file) array.push({ url: file });
        });
    } else {
        // an object with a single option
        const file = files.trim();
        if (file) array.push({ url: file });
    }
    return array;
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
