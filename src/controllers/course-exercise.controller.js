const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const arrayHelper = require("../helpers/array.helper");
const exerciseHelper = require("../helpers/exercise.helper");
const { EventEmitter } = require("events");
const uploadFileService = require("../services/upload-file.service");
const fileService = require("../services/file.service");
const exerciseBlobService = require("../services/exercise-blob.service");
const stringHelper = require("../helpers/string.helper");
const svgHelper = require("../helpers/svg.helper");

const { availableExerciseTypes, availableLevels, imageExtensions } = require("../constants/constants");

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
    const { courseId, chapterId, lessonId, levelId } = req.params;

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

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == levelId);

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
        fileIds,
        position,
    } = req.body;

    // let { exerciseId } = req.body;

    let exercise;

    if (!["1", "2", "3", "4"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const exerciseIdObj = courseService.getObjectId();
        const exerciseId = exerciseIdObj.toString();

        exercise = {
            _id: exerciseIdObj,
            code: await idGeneratorMongoService.getNextId("exercises"),
            statement,
            solution,
            answer,
            exerciseType,
            contestName,
            sourceName,
            author,
            courseId,
        };

        if (hints) exercise.hints = getHintsAsArray(hints);

        if (answerOptions) exercise.answerOptions = getAnswerOptionsAsArray(answerOptions, isCorrectAnswerChecks);

        const fileIdsAsArray = getFileIdsAsArray(fileIds);
        if (fileIdsAsArray.length > 0) exercise.files = await getExerciseFilesFromIds(fileIdsAsArray);

        await exerciseService.insertOne(exercise);

        if (fileIdsAsArray.length > 0) await fileService.updateSourceIds(fileIdsAsArray, exerciseId);

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapter = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapter) return res.status(500).send("Capitol negăsit!");

        const lesson = (chapter.lessons || []).find((x) => x.id === lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        // TODO use the "addExerciseToLocation()" method
        const newExercise = {
            levelId,
            id: exerciseId,
        };

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .filter((x) => x.levelId == levelId);

        arrayHelper.moveOrInsertAtIndex(newExercises, newExercise, "id", position);

        // remove all exercises within the current level
        lesson.exercises = (lesson.exercises || []).filter((x) => !(x.levelId == levelId));

        // add all the new exercises within the current level and sort the result
        lesson.exercises = (lesson.exercises || []).concat(newExercises).sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId);

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

            (exercise.files || []).forEach((file) => {
                const fileExtension = stringHelper.getFileExtension(file.name);
                file.extension = fileExtension;
                file.isImage = imageExtensions.includes(fileExtension);
            });
        }

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == exerciseMeta.levelId);

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
        // fileIds, // we don't need them as new or deleted files already updated the files field in the exercise
        position,
    } = req.body;

    const { exerciseId } = req.body;

    let exercise;

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

        if (answerOptions) exercise.answerOptions = getAnswerOptionsAsArray(answerOptions, isCorrectAnswerChecks);

        if (hints) exercise.hints = getHintsAsArray(hints);

        await exerciseService.updateOne(exercise);

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapter = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapter) return res.status(500).send("Capitol negăsit!");

        const lesson = (chapter.lessons || []).find((x) => x.id === lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        // TODO use the "addExerciseToLocation()" method
        const newExercise = {
            levelId,
            id: exercise._id.toString(),
        };

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .filter((x) => x.levelId == levelId);

        arrayHelper.moveOrInsertAtIndex(newExercises, newExercise, "id", position);

        // remove all exercises within the current level
        lesson.exercises = (lesson.exercises || []).filter((x) => !(x.levelId == levelId));

        // add all the new exercises within the current level and sort the result
        lesson.exercises = (lesson.exercises || []).concat(newExercises).sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId);

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
        const { levelId } = exerciseMeta;

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

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == levelId);

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

            levelId,

            availablePositions,
            selectedPosition,

            availableCourses,
            availableLessons,
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
    //const { courseId, chapterId, lessonId, levelId, exerciseId } = req.params;

    const {
        exerciseId,

        courseId: courseIdOld,
        lessonId: lessonIdOld,
        levelId: levelIdOld,
        positionId: positionIdOld,

        course: courseIdNew,
        lesson: lessonIdNew,
        level: levelIdNew,
        position: positionIdNew,
    } = req.body;

    const redirectUri = `/cursuri/${courseIdNew}/lectii/${lessonIdNew}/modifica`;

    // let lessonRef, courseCode, chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        // if nothing has changed, redirect
        if (lessonIdNew == lessonIdOld && levelIdNew == levelIdOld && positionIdNew == positionIdOld) {
            return res.redirect(redirectUri);
        }

        let isValid, message;
        ({ isValid, message } = await removeExerciseFromLocation(courseIdOld, exerciseId));

        // remove the exercise from the old location
        if (!isValid) return res.status(500).send(message);

        // add the exercise to the new location
        ({ isValid, message } = await addExerciseToLocation(courseIdNew, lessonIdNew, levelIdNew, positionIdNew, exerciseId));
        if (!isValid) return res.status(500).send(message);

        if (courseIdNew != courseIdOld) await exerciseService.updateCourseId(exerciseId, courseIdNew);

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
    const { courseId, lessonId, levelId, exerciseId } = req.params;
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

        // sort exercises by levelId
        const newExercises = (lessonRef.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == levelId);

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
        if (!course) return res.status(404).send("Curs negăsit!");

        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(404).send("Exercițiu negăsit.");

        const { lesson, exerciseMeta, exerciseIndex } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);

        // 1. Remove the exercise reference from the lesson
        if (exerciseIndex > -1) {
            lesson.exercises.splice(exerciseIndex, 1); // remove from array
            await courseService.updateOne(course);
        }

        // 2. Delete the blobs, if exist
        const files = (exercise && exercise.files) || [];
        const fileIds = files.map((x) => x.id);
        if (fileIds.length > 0) {
            const filesFromDB = await fileService.getAllByIds(fileIds);

            filesFromDB.forEach(async (fileFromDB) => {
                // TODO: extract the common code in a separate method (see "Delete from Azure blobs" section in "DeleteFileById" and also "FilesController")
                const fileExtension = stringHelper.getFileExtension(fileFromDB.name);
                const blobName = `${fileFromDB._id.toString()}.${fileExtension}`;
                await exerciseBlobService.deleteBlobIfExists(blobName);
            });

            // Delete also from Files
            await fileService.deleteAllByIds(fileIds);
        }

        // 3. Delete the exercise itself
        await exerciseService.deleteOneById(exerciseId);

        res.redirect(`/cursuri/${courseId}/lectii/${lesson.id}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.uploadFiles = async (req, res) => {
    const { courseId, exerciseId } = req.params;

    const containerClient = exerciseBlobService.getContainerClient();

    const params = {
        maxFileSize: 1 * 1024 * 1024, // 1 MB
        maxFiles: 3,
        allowedExtensions: ["png", "svg", "jpeg", "jpg", "pdf"],
        containerClient,
    };

    const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
    if (!canCreateOrEditExercise) {
        return res.status(403).json({ code: "forbidden", message: "Lipsă permisiuni." });
    }

    const emitter = new EventEmitter();
    try {
        uploadFileService.uploadFiles(req, emitter, params);

        emitter.once("uploaded", async (result) => {
            const resultFiles = result.files.filter((x) => x.isSuccess);
            if (resultFiles.length == 0) return res.json(result);

            // 1. Save file to DB.
            const filesToDB = resultFiles.map((file) => ({
                _id: fileService.getObjectId(file.id),
                name: file.name,
                url: file.url,
                size: file.size,

                accountName: exerciseBlobService.getAccountName(),
                containerName: "exercises",
                sourceType: `/cursuri/${courseId}/exercitii`,
                sourceId: exerciseId, // exerciseId is defined only in editMode
                createdOn: new Date(),
                createdBy: { id: req.user._id.toString(), name: `${req.user.firstName} ${req.user.lastName}` },
            }));

            if (filesToDB.length > 0) await fileService.insertMany(filesToDB);

            // 2. Add the new files to the exercise (edit mode only)
            if (exerciseId) {
                const exercise = await exerciseService.getOneById(exerciseId);
                if (!exercise) return res.status(404).send("Exercițiu negăsit.");

                const filesToExercise = resultFiles.map((file) => ({
                    id: file.id,
                    name: file.name,
                    url: file.url,
                    size: file.size,
                }));

                // Concatenate the two arrays
                exercise.files = [...(exercise.files || []), ...filesToExercise];
                await exerciseService.updateOne(exercise);
            }

            // 3. If svg, scale down to 80%
            const scaleRatio = 80; // scale down to 80%
            const svgResultFiles = resultFiles.filter((file) => stringHelper.getFileExtension(file.name) == "svg");
            let svgResultFilesCount = svgResultFiles.length;
            if (svgResultFilesCount == 0) return res.json(result);

            emitter.once("allSvgResized", () => {
                return res.json(result);
            });

            svgResultFiles.forEach(async (file) => {
                const fileExtension = stringHelper.getFileExtension(file.name);
                const blobName = `${file.id}.${fileExtension}`;

                // Acest "await" din fața lui "downloadBlobToString" împiedică execuția instrucțiunilor următoare din ciclul curent forEach
                // până când streamul nu e complet descărcat, dar lasă procesorul liber pentru următoarele cicluri forEach și apoi pentru codul care urmează după forEach.
                // Acest comportament este normal atunci când lucrăm cu stream-uri, unde evenimentele unde fluxul de date (evenimentul on data) soseștie asincron.
                // Am experimentat atât cu "downloadBlobToString", cât și cu alte metode din streamHelper.
                const oldContent = await exerciseBlobService.downloadBlobToString(blobName);

                const newContent = svgHelper.resizeSvg(oldContent, scaleRatio);

                await exerciseBlobService.uploadBlobFromString(newContent, blobName, "image/svg+xml");

                svgResultFilesCount--;

                if (svgResultFilesCount == 0) emitter.emit("allSvgResized");
            });
        });
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
    }
};

exports.deleteFileById = async (req, res) => {
    const { exerciseId, fileId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).json({ code: "forbidden", message: "Lipsă permisiuni." });
        }

        // Delete from exercise (edit mode only)
        if (exerciseId) {
            const exercise = await exerciseService.getOneById(exerciseId);
            if (!exercise) return res.status(404).send("Exercițiu negăsit.");

            const fileIndex = (exercise.files || []).findIndex((x) => x.url.includes(fileId));
            if (fileIndex > -1) {
                exercise.files.splice(fileIndex, 1); // remove from array
                exerciseService.updateOne(exercise);
            }
        }

        // Delete from Azure blobs
        const fileFromDB = await fileService.getOneById(fileId);
        if (fileFromDB) {
            const fileExtension = stringHelper.getFileExtension(fileFromDB.name);
            const blobName = `${fileId}.${fileExtension}`;
            const blobDeleteResponse = await exerciseBlobService.deleteBlobIfExists(blobName);

            if (blobDeleteResponse.errorCode && blobDeleteResponse.errorCode !== "BlobNotFound") {
                return res.status(500).json("Eroare la ștergerea blob-ului.");
            }
        }

        // Delete from files
        if (fileFromDB) await fileService.deleteOneById(fileId);

        res.sendStatus(204); // no content
        // return res.json(exercise.files);
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
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

const getFileIdsAsArray = (fileIds) => {
    if (!fileIds) return [];

    const array = [];
    if (Array.isArray(fileIds)) {
        fileIds.forEach((id) => {
            id = id.trim();
            if (id) array.push(id);
        });
    } else {
        // an object with a single option
        const id = fileIds.trim();
        if (id) array.push(id);
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

const addExerciseToLocation = async (courseId, lessonId, levelId, positionId, exerciseId) => {
    const course = await courseService.getOneById(courseId);
    if (!course) return { isValid: false, message: "Curs negăsit!" };

    let updateResult,
        lessonFound = false;

    for (const chapter of course.chapters || []) {
        const lesson = (chapter.lessons || []).find((l) => l.id == lessonId);
        if (lesson) {
            lessonFound = true;

            const newExercise = {
                levelId,
                id: exerciseId,
            };

            // sort exercises by levelId
            const newExercises = (lesson.exercises || [])
                .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
                .filter((x) => x.levelId == levelId);

            arrayHelper.moveOrInsertAtIndex(newExercises, newExercise, "id", positionId);

            // remove all exercises within the current level
            lesson.exercises = (lesson.exercises || []).filter((x) => !(x.levelId == levelId));

            // add all the new exercises within the current level and sort the result
            lesson.exercises = (lesson.exercises || []).concat(newExercises).sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId);

            updateResult = await courseService.updateOne(course);

            break;
        }
    }

    if (!lessonFound) return { isValid: false, message: "Lecție negăsită!" };
    if (updateResult.modifiedCount != 1) return { isValid: false, message: "Eroare la salvarea în DB!" };

    return { isValid: true };
};

// Input: an array of fileIds
// Output: an array of files
const getExerciseFilesFromIds = async (fileIds) => {
    if (!fileIds) return [];

    const files = [];
    const filesFromDB = await fileService.getAllByIds(fileIds);

    fileIds.forEach((fileId) => {
        const file = filesFromDB.find((x) => x._id.toString() == fileId);

        // Inside an exercise we don't store all file details
        files.push({
            id: fileId, // or file._id.toString(),
            name: file.name,
            url: file.url,
            size: file.size,
        });
    });
    return files;
};
