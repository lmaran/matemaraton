const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");
const lessonHelper = require("../helpers/lesson.helper");
const sheetService = require("../services/sheet.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const lessonBlobService = require("../services/lesson-blob.service");
const uploadFileService = require("../services/upload-file.service");
const fileService = require("../services/file.service");
const { EventEmitter } = require("events");

const prettyJsonHelper = require("../helpers/pretty-json.helper");
const stringHelper = require("../helpers/string.helper");
const svgHelper = require("../helpers/svg.helper");

const { availableLevels, imageExtensions } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { lessonId } = req.params;

    let isTheoryTabActive, isExercisesTabActive, isSheetsTabActive;
    const viewParameter = req.query.view;
    switch (viewParameter) {
        case "exercitii":
            isExercisesTabActive = true;
            break;
        case "fise":
            isSheetsTabActive = true;
            break;
        default:
            isTheoryTabActive = true;
    }

    try {
        // Validate parameters
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const course = await courseService.getOneById(lesson.courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex, prevLessonId, nextLessonId } = lessonHelper.getLessonParentInfo(course, lessonId);

        if (lesson.theory) {
            lesson.theory.textPreview = markdownService.render(lesson.theory.text);
        }

        const exercisesFromDb = await getAllExercisesInLesson(lesson);

        lesson.levelsObj = getLevelsObj(lesson.exercises, exercisesFromDb, true);

        // Remove unnecessary fields
        if (lesson.theory) delete lesson.theory.text;
        delete lesson.exercises;

        lesson.sheets = lesson.sheetIds ? await sheetService.getAllByIds(lesson.sheetIds) : [];

        lesson.sheets.forEach((sheet) => (sheet.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(sheet.createdOn))); // ex: 22.11.2023

        const data = {
            isTheoryTabActive,
            isExercisesTabActive,
            isSheetsTabActive,

            viewParameter,

            courseId: lesson.courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lesson,
            lessonId,
            lessonIndex,
            prevLessonId,
            nextLessonId,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `${lesson.name}`,
            user: req.user,
        };

        //res.send(data);
        res.render("lesson/lesson", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.jsonGetOneById = async (req, res) => {
    const { lessonId } = req.params;

    try {
        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const course = await courseService.getOneById(lesson.courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);

        const lessonAsPrettyJson = prettyJsonHelper.getPrettyJson(lesson);

        const data = {
            courseId: lesson.courseId,
            courseCode: course.code,

            chapterId: chapter.id,
            chapterIndex,

            lessonId,
            lessonIndex,
            lessonName: lesson.name,

            lessonAsPrettyJson,

            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `${lesson.name}`,
        };

        //res.send(data);
        res.render("lesson/lesson-json", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createGet = async (req, res) => {
    const { courseId, chapterId } = req.query;

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

        // TODO: refactor (duplicates, see GetOneById or Move)
        const lessonIds = lessonHelper.getAllLessonIdsFromChapter(chapter);
        const lessonsFromDB = await lessonService.getAllByIds(lessonIds);

        const availableLessons = lessonHelper.getAvailableLessonsFromChapter(chapter, lessonsFromDB);

        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(availableLessons, undefined));

        const data = {
            isGeneralTabActive: true,

            courseId,
            courseCode: course.code,

            chapterId,
            chapterIndex,

            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("lesson/lesson-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createPost = async (req, res) => {
    const userId = req.user?._id?.toString();
    const { courseId, chapterId, name, description, isHidden, position, theory } = req.body;

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

        const lessonIdObj = courseService.getObjectId();
        const lessonId = lessonIdObj.toString();

        lesson = {
            _id: lessonIdObj,
            courseId,
            name,
            description,
            ownerId: userId,
        };

        if (theory)
            lesson.theory = {
                text: theory.trim(),
            };

        if (isHidden === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            lesson.isHidden = true;
        } else delete lesson.isHidden;

        chapterRef.lessonIds = chapterRef.lessonIds || [];

        arrayHelper.moveOrInsertStringAtIndex(chapterRef.lessonIds, lessonId, position);

        courseService.updateOne(course);
        lessonService.insertOne(lesson);

        res.redirect(`/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editGet = async (req, res) => {
    const { lessonId } = req.params;
    let viewParameter = req.query.view;

    let isTheoryTabActive, isExercisesTabActive, isSheetsTabActive, isGeneralTabActive;
    switch (viewParameter) {
        case "exercitii":
            isExercisesTabActive = true;
            break;
        case "fise":
            isSheetsTabActive = true;
            break;
        case "general":
            isGeneralTabActive = true;
            viewParameter = "";
            break;
        default:
            isTheoryTabActive = true;
    }

    let availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const course = await courseService.getOneById(lesson.courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter, chapterIndex, lessonIndex, prevLessonId, nextLessonId } = lessonHelper.getLessonParentInfo(course, lessonId);

        if (lesson.theory) {
            lesson.theory.textPreview = markdownService.render(lesson.theory.text);
        }

        const exercisesFromDb = await getAllExercisesInLesson(lesson);

        lesson.levelsObj = getLevelsObj(lesson.exercises, exercisesFromDb, true);

        // Remove unnecessary fields
        delete lesson.exercises;

        // TODO: refactor (duplicates, see GetOneById or Move)
        const lessonIds = lessonHelper.getAllLessonIdsFromChapter(chapter);
        const lessonsFromDB = await lessonService.getAllByIds(lessonIds);

        const availableLessons = lessonHelper.getAvailableLessonsFromChapter(chapter, lessonsFromDB);

        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(availableLessons, lessonId));

        lesson.sheets = lesson.sheetIds ? await sheetService.getAllByIds(lesson.sheetIds) : [];

        lesson.sheets.forEach((sheet) => (sheet.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(sheet.createdOn))); // ex: 22.11.2023

        (lesson.files || []).forEach((file) => {
            const fileExtension = stringHelper.getFileExtension(file.name);
            file.extension = fileExtension;
            file.isImage = imageExtensions.includes(fileExtension);
        });

        const data = {
            isTheoryTabActive,
            isExercisesTabActive,
            isSheetsTabActive,
            isGeneralTabActive,

            viewParameter,

            isEditMode: true,
            courseId: lesson.courseId,
            courseCode: course.code,
            chapterId: chapter.id,
            chapterIndex,
            lesson,
            lessonId,
            lessonIndex,
            prevLessonId,
            nextLessonId,

            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("lesson/lesson-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.editPost = async (req, res) => {
    const { name, description, isHidden, position, theory } = req.body;
    const { lessonId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        const course = await courseService.getOneById(lesson.courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter } = lessonHelper.getLessonParentInfo(course, lessonId);

        // Update lesson fields
        lesson.name = name;
        lesson.description = description;
        lesson.theory = {
            text: theory.trim(),
        };

        if (isHidden === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            lesson.isHidden = true;
        } else delete lesson.isHidden;

        arrayHelper.moveOrInsertStringAtIndex(chapter.lessonIds, lessonId, position);

        courseService.updateOne(course);
        lessonService.updateOne(lesson);

        res.redirect(`/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { lessonId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const lesson = await lessonService.getOneById(lessonId);
        if (!lesson) return res.status(500).send("Lecție negăsită!");

        if (lesson.exercises && lesson.exercises.length > 0) {
            return res.status(403).send("Șterge întâi exercițiile!");
        }

        const course = await courseService.getOneById(lesson.courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const { chapter } = lessonHelper.getLessonParentInfo(course, lessonId);

        chapter.lessonIds = (chapter.lessonIds || []).filter((x) => x != lessonId); // remove from array
        await courseService.updateOne(course);
        await lessonService.deleteOneById(lessonId);

        res.redirect(`/cursuri/${lesson.courseId}/capitole/${chapter.id}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

// TODO: Refactor (remove duplicate code, see LessonTheory)
exports.uploadFiles = async (req, res) => {
    const userId = req.user?._id?.toString();
    const { lessonId } = req.params;

    const containerClient = lessonBlobService.getContainerClient();

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

                accountName: lessonBlobService.getAccountName(),
                containerName: "lectii",
                sourceType: `/lectii`,
                sourceId: lessonId, // lessonId is defined only in editMode
                ownerId: userId,
                createdOn: new Date(),
                createdBy: { id: userId, name: `${req.user.firstName} ${req.user.lastName}` },
            }));

            if (filesToDB.length > 0) await fileService.insertMany(filesToDB);

            // 2. Add the new files to the lesson (edit mode only)
            if (lessonId) {
                const lesson = await lessonService.getOneById(lessonId);
                if (!lesson) return res.status(404).send("Lecție negăsită.");

                const filesToLesson = resultFiles.map((file) => ({
                    id: file.id,
                    name: file.name,
                    url: file.url,
                    size: file.size,
                }));

                // Concatenate the two arrays
                lesson.files = [...(lesson.files || []), ...filesToLesson];
                await lessonService.updateOne(lesson);
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
                const oldContent = await lessonBlobService.downloadBlobToString(blobName);

                const newContent = svgHelper.resizeSvg(oldContent, scaleRatio);

                await lessonBlobService.uploadBlobFromString(newContent, blobName, "image/svg+xml");

                svgResultFilesCount--;

                if (svgResultFilesCount == 0) emitter.emit("allSvgResized");
            });
        });
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
    }
};

exports.deleteFileById = async (req, res) => {
    const { lessonId, fileId } = req.params;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).json({ code: "forbidden", message: "Lipsă permisiuni." });
        }

        // Delete from lesson (edit mode only)
        if (lessonId) {
            const lesson = await lessonService.getOneById(lessonId);
            if (!lesson) return res.status(404).send("Lecție negăsită.");

            lesson.files = (lesson.files || []).filter((x) => x.id != fileId);
            lessonService.updateOne(lesson);
        }

        // Delete from Azure blobs
        const fileFromDB = await fileService.getOneById(fileId);
        if (fileFromDB) {
            const fileExtension = stringHelper.getFileExtension(fileFromDB.name);
            const blobName = `${fileId}.${fileExtension}`;
            const blobDeleteResponse = await lessonBlobService.deleteBlobIfExists(blobName);

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

// Get all unique exercises in a lesson
const getAllExercisesInLesson = async (lesson) => {
    let allExercises = [];
    const allExercisesIds = (lesson.exercises || []).map((x) => x.id);

    // Deduplicate exercisesIds
    const allUniqueExercisesIds = [...new Set(allExercisesIds)];

    // Get exercises from DB
    if (allUniqueExercisesIds.length > 0) {
        allExercises = await exerciseService.getAllByIds(allUniqueExercisesIds);
    }

    return allExercises;
};

//  exercisesRef: [
//     { id: '5f4636cd17efad83f707e937', level: 1 },
//     { id: '5f47d415eb57b91c67e5367d', level: 1 },
//     { id: '5f47dec6eb57b91c67e5367e', evel: 2 }]
const getLevelsObj = (exercisesRef, exercisesFromDb, clear) => {
    // Initialize the level backbone (we need all levels in editMode)
    const levels = [];

    availableLevels.forEach((l) => {
        levels.push({
            id: l.id,
            name: l.name,
            total: 0,
            exercises: [],
        });
    });

    const levelsObj = {
        total: 0,
        levels: levels,
    };

    if (!exercisesRef) return levelsObj;

    // Sort exercises by levelId
    exercisesRef.sort((exerciseA, exerciseB) => exerciseA.levelId - exerciseB.levelId);

    const exercises = exercisesRef.map((x) => {
        let exercise = exercisesFromDb.find((y) => y._id.toString() === x.id);

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

        const level = levelsObj.levels.find((l) => l.id == e.levelId);
        if (level) {
            level.exercises.push(exercise);
            level.total++;
            levelsObj.total++;
        }
    });

    return levelsObj;
};
