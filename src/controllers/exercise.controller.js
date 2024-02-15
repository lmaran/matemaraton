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
const lessonService = require("../services/lesson.service");
const lessonHelper = require("../helpers/lesson.helper");

const { availableExerciseTypes, availableLevels, imageExtensions } = require("../constants/constants");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.getAll = async (req, res) => {
    const pageSizes = [
        { text: "10 pe pagină", value: "10" },
        { text: "30 pe pagină", value: "30" },
        { text: "50 pe pagină", value: "50" },
    ];

    const currentPage = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (limit > 100) limit = 50;
    const startIndex = (currentPage - 1) * limit;
    let endIndex = currentPage * limit;

    const query = {
        skip: startIndex,
        limit,
    };

    const [exercises, totalExercises] = await Promise.all([await exerciseService.getAll(query), await exerciseService.count()]);

    if (endIndex > totalExercises) endIndex = totalExercises; // fix endIndex for the last page

    exercises.forEach((exercise) => {
        const statement = `**[E.${exercise.code}.](/exercitii/${exercise._id})** ${exercise.statement}`;

        const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

        if (exercise.answerOptions) {
            exercise.answerOptions.forEach((answerOption, idx) => {
                // Insert a label (letter) in front of each option: "a" for the 1st option, "b" for the 2nd a.s.o.
                answerOption.textPreview = markdownService.render(`${alphabet[idx]}) ${answerOption.text}`);
                if (answerOption.isCorrect) {
                    exercise.correctAnswerPreview = markdownService.render(`**Răspuns:** ${answerOption.text}`);
                }
            });
        }
        if (exercise.statement) {
            exercise.statementPreview = markdownService.render(statement);
        }

        if (exercise.solution) {
            exercise.solutionPreview = markdownService.render(exercise.solution);
        }
        if (exercise.hints) {
            exercise.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Hint ${idx + 1}:** ${hint.text}`);
            });
        }

        const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
        exercise.authorAndSource1 = authorAndSource1;
        exercise.source2 = source2;
    });

    const totalPages = Math.ceil(totalExercises / limit);

    const pageResults = {
        totalExercises,
        pageSizes,
        pageSize: limit,
        startIndex: startIndex + 1,
        endIndex,
        previousPageBtn: {
            page: currentPage - 1,
            isDisabled: currentPage === 1,
        },
        nextPageBtn: {
            page: currentPage + 1,
            isDisabled: currentPage === totalPages,
        },
    };

    const data = {
        exercises,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise"),
        pageResults,
    };
    // res.send(data);
    res.render("exercise/exercise-list", data);
};

exports.getOneById = async (req, res) => {
    const { exerciseId } = req.params;
    let availablePositions, selectedPosition;

    try {
        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const lessonId = exercise.lessonId;
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const courseId = lesson.courseId;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex, levelId } = exerciseHelper.getExerciseParentInfo(course, lesson, lessonId, exerciseId);

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

            lessonId,
            lessonIndex,

            levelId: levelId,
            exercise,

            availablePositions,
            selectedPosition,
            availableExerciseTypes,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `E.${exercise.code}`,
        };

        //res.send(data);
        res.render("exercise/exercise", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createGet = async (req, res) => {
    const { lessonId, levelId } = req.query;

    let availablePositions, selectedPosition, exercise;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const courseId = lesson.courseId;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);

        exercise = { exerciseType: 1 }; // Set 'open answer' as the default exercise type

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == levelId);

        // In editMode, exerciseId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, undefined, true));

        const data = {
            isEditMode: false,

            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId,
            lessonIndex,

            levelId,

            exercise,

            availablePositions,
            selectedPosition,
            availableExerciseTypes,
        };

        //res.send(data);
        res.render("exercise/exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createPost = async (req, res) => {
    const {
        lessonId,
        levelId,
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

    let exercise;

    if (!["1", "2", "3", "4"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

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
            courseId: lesson.courseId,
            lessonId,
        };

        if (hints) exercise.hints = getHintsAsArray(hints);

        if (answerOptions) exercise.answerOptions = getAnswerOptionsAsArray(answerOptions, isCorrectAnswerChecks);

        const fileIdsAsArray = getFileIdsAsArray(fileIds);
        if (fileIdsAsArray.length > 0) exercise.files = await getExerciseFilesFromIds(fileIdsAsArray);

        await exerciseService.insertOne(exercise);

        if (fileIdsAsArray.length > 0) await fileService.updateSourceIds(fileIdsAsArray, exerciseId);

        // TODO use the "addExerciseToLocation()" method
        const newExercise = {
            levelId,
            id: exerciseId,
        };

        // Sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .filter((x) => x.levelId == levelId);

        arrayHelper.moveOrInsertObjectAtIndex(newExercises, newExercise, "id", position);

        // Remove all exercises within the current level
        lesson.exercises = (lesson.exercises || []).filter((x) => !(x.levelId == levelId));

        // Add all the new exercises within the current level and sort the result
        lesson.exercises = (lesson.exercises || []).concat(newExercises).sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId);

        lessonService.updateOne(lesson);

        res.redirect(`/exercitii/${exerciseId}/modifica`);

        //res.send(req.body);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editGet = async (req, res) => {
    const { exerciseId } = req.params;

    let availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) return res.status(403).send("Lipsă permisiuni!"); // forbidden

        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const lessonId = exercise.lessonId;
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const courseId = lesson.courseId;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex, levelId } = exerciseHelper.getExerciseParentInfo(course, lesson, lessonId, exerciseId);

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
            .filter((x) => x.levelId == levelId);

        // In editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, exerciseId, true));

        const data = {
            isEditMode: true,

            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId,
            lessonIndex,

            levelId,

            availablePositions,
            selectedPosition,
            exercise,
            availableExerciseTypes,
        };

        //res.send(data);
        res.render("exercise/exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editPost = async (req, res) => {
    const { levelId, contestName, exerciseType, sourceName, author, statement, answer, answerOptions, isCorrectAnswerChecks, solution, hints } =
        req.body;

    const { exerciseId } = req.body;

    let exercise;

    if (!["1", "2", "3", "4"].includes(levelId)) return res.status(500).send("Nivel de dificultate invalid!");

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

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

        res.redirect(`/exercitii/${exerciseId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.moveGet = async (req, res) => {
    const { exerciseId } = req.params;

    let availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const lessonId = exercise.lessonId;
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const courseId = lesson.courseId;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex, levelId } = exerciseHelper.getExerciseParentInfo(course, lesson, lessonId, exerciseId);

        let availableCourses = await courseService.getCoursesNames();
        availableCourses = availableCourses.map((c) => {
            c.name = `${c.code}: ${c.name};`;
            return c;
        });

        // TODO: refactor (duplicates, see GetOneById or Move)
        const lessonIds = lessonHelper.getAllLessonIdsFromCourse(course);
        const lessonsFromDB = await lessonService.getAllByIds(lessonIds);

        const availableLessons = lessonHelper.getAvailableLessons(course, lessonsFromDB);

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == levelId);

        // In editMode, lessonId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(newExercises, exerciseId, true));

        const data = {
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId,
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
        res.render("exercise/exercise-move", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.movePost = async (req, res) => {
    const {
        exerciseId,

        lessonId: lessonIdOld,
        levelId: levelIdOld,
        positionId: positionIdOld,

        lesson: lessonIdNew,
        level: levelIdNew,
        position: positionIdNew,
    } = req.body;

    const redirectUri = `/lectii/${lessonIdNew}/modifica`;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        // If nothing has changed, redirect
        if (lessonIdNew == lessonIdOld && levelIdNew == levelIdOld && positionIdNew == positionIdOld) {
            return res.redirect(redirectUri);
        }

        let isValid, message;
        // Remove the exercise from the old location
        if (lessonIdNew != lessonIdOld) {
            ({ isValid, message } = await removeExerciseFromLocation(lessonIdOld, exerciseId));
            if (!isValid) return res.status(500).send(message);
        }

        // Add the exercise to the new location
        ({ isValid, message } = await addExerciseToLocation(lessonIdNew, levelIdNew, positionIdNew, exerciseId));
        if (!isValid) return res.status(500).send(message);

        if (lessonIdNew != lessonIdOld) {
            const newExercisePartial = {
                _id: exerciseId,
                lessonId: lessonIdNew,
            };
            await exerciseService.updateOne(newExercisePartial);
        }

        // res.send(data);
        res.redirect(redirectUri);
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

        const lessonIds = lessonHelper.getAllLessonIdsFromCourse(course);
        const lessonsFromDB = await lessonService.getAllByIds(lessonIds);

        const availableLessons = lessonHelper.getAvailableLessons(course, lessonsFromDB);

        const data = {
            availableLessons,
        };

        res.send(data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAvailablePositions = async (req, res) => {
    const { lessonId, levelId, exerciseId } = req.params;
    let availablePositions;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        // sort exercises by levelId
        const newExercises = (lesson.exercises || [])
            .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
            .map((x, idx) => {
                x.name = `Problema ${++idx}`;
                return x;
            })
            .filter((x) => x.levelId == levelId);

        // In editMode, lessonId will be undefined (falsy)
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
    const { exerciseId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const lessonId = exercise.lessonId;
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const courseId = lesson.courseId;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex, levelId } = exerciseHelper.getExerciseParentInfo(course, lesson, lessonId, exerciseId);

        const exerciseAsPrettyJson = prettyJsonHelper.getPrettyJson(exercise);

        const data = {
            courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId,
            lessonIndex,

            levelId,

            exerciseId,
            exerciseCode: exercise.code,

            exerciseAsPrettyJson,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        //res.send(data);
        res.render("exercise/exercise-json", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { exerciseId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const lessonId = exercise.lessonId;
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const courseId = lesson.courseId;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        // 1. Remove the exercise reference from the lesson
        lesson.exercises = (lesson.exercises || []).filter((x) => !(x.id == exerciseId)); // remove from array
        await lessonService.updateOne(lesson);

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

        res.redirect(`/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

// TODO: Refactor (remove duplicate code, see LessonTheory)
exports.uploadFiles = async (req, res) => {
    const { exerciseId } = req.params;

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
                sourceType: `/exercitii`,
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

            exercise.files = (exercise.files || []).filter((x) => x.id != fileId);
            exerciseService.updateOne(exercise);
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
        // An object with a single option
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
        // An object with a single option
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

                // Set isCorrectAnswer (if apply)
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
        // An object with a single option
        const answerOptions = answerOptions.trim();
        if (answerOptions) {
            const newAnswerOption = { text: answerOptions };

            // Set isCorrectAnswer (if apply)
            if (isCorrectAnswerChecks && isCorrectAnswerChecks === "1") {
                newAnswerOption.isCorrect = true;
            }
            answerOptionsAsArray.push(newAnswerOption);
        }
    }
    return answerOptionsAsArray;
};

const removeExerciseFromLocation = async (lessonId, exerciseId) => {
    const lesson = await lessonService.getOneById(lessonId);
    if (!lesson) return { isValid: false, message: "Lecție negăsită!" };

    // Remove the exercise and save to DB
    lesson.exercises = (lesson.exercises || []).filter((x) => x.id != exerciseId);
    const updateResult = await lessonService.updateOne(lesson);

    if (updateResult.modifiedCount != 1) return { isValid: false, message: "Eroare la salvarea în DB!" };

    return { isValid: true };
};

const addExerciseToLocation = async (lessonId, levelId, positionId, exerciseId) => {
    const lesson = await lessonService.getOneById(lessonId);
    if (!lesson) return { isValid: false, message: "Lecție negăsită!" };

    const newExercise = {
        levelId,
        id: exerciseId,
    };

    // Sort exercises by levelId
    const newExercises = (lesson.exercises || [])
        .sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId)
        .filter((x) => x.levelId == levelId);

    arrayHelper.moveOrInsertObjectAtIndex(newExercises, newExercise, "id", positionId);

    // Remove all exercises within the current level
    lesson.exercises = (lesson.exercises || []).filter((x) => !(x.levelId == levelId));

    // Add all the new exercises within the current level and sort the result
    lesson.exercises = (lesson.exercises || []).concat(newExercises).sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId);

    const updateResult = await lessonService.updateOne(lesson);

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
