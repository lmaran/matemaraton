const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");

exports.getOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

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
        lessonRef.index = chapterRef.lessons.findIndex((x) => x.id === lessonId);

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
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        //res.send(data);
        res.render("course-lesson/course-lesson", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

    const activeSectionId = req.query.sectionId;
    const activeLevelId = req.query.levelId;

    const isEditMode = !!lessonId;

    let lessonRef, courseCode, chapterIndex, positionOptions, selectedPosition;

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

            lessonRef.index = chapterRef.lessons.findIndex((x) => x.id === lessonId);

            if (lessonRef.theory) {
                lessonRef.theory.textPreview = markdownService.render(lessonRef.theory.text);
            }

            const exercisesFromDb = await getAllExercisesInLesson(lessonRef);

            lessonRef.sectionsObj = getSectionsObj(lessonRef.exercises, exercisesFromDb, true);

            setActivelLevel(lessonRef.sectionsObj, activeSectionId, activeLevelId);

            // remove unnecessary fields
            delete lessonRef.exercises;

            // in editMode, lessonId will be undefined (falsy)
            // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
            ({ positionOptions, selectedPosition } = getPositionOptions(chapterRef.lessons, lessonId));
        }

        const data = {
            isEditMode,
            courseId,
            courseCode,
            chapterId,
            chapterIndex,
            lesson: lessonRef,
            positionOptions,
            selectedPosition,
        };

        //res.send(data);
        res.render("course-lesson/course-lesson-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditPost = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    let lessonId = req.params.lessonId;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const isEditMode = !!lessonId;

        const { name, description, isHidden, position, theory } = req.body;

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        const chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
        if (!chapterRef) return res.status(500).send("Capitol negăsit!");

        if (isEditMode) {
            const lessonRef = (chapterRef.lessons || []).find((x) => x.id === lessonId);
            if (!lessonRef) return res.status(500).send("Lecție negăsită!");

            // update lesson fields
            lessonRef.name = name;
            lessonRef.description = description;
            lessonRef.theory = {
                text: theory.trim(),
            };

            if (isHidden === "on") {
                // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                lessonRef.isHidden = true;
            } else delete lessonRef.isHidden;

            // move the lesson from one position (index) to another
            const lessonIndex = (chapterRef.lessons || []).findIndex((x) => x.id === lessonId);

            const lessonsRef = chapterRef.lessons || [];
            if (position != lessonIndex && position > -1 && position < lessonsRef.length) {
                arrayHelper.move(lessonsRef, lessonIndex, position);
            }
        } else {
            // new lesson
            lessonId = courseService.getObjectId().toString();
            const newLesson = {
                id: lessonId,
                name,
                description,
                position,
                theory: { text: theory.trim() },
            };

            if (isHidden === "on") {
                // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                newLesson.isHidden = true;
            }

            const lessonsRef = chapterRef.lessons || [];
            if (position > -1 && position < lessonsRef.length) {
                lessonsRef.splice(position, 0, newLesson); // insert at the specified index
            } else {
                lessonsRef.push(newLesson);
            }
        }

        courseService.updateOne(course);

        //const data = { courseCode, chapterIndex, course };
        //res.send(data);
        res.redirect(`/cursuri/${courseId}/capitole/${chapterId}/lectii/${lessonId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

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

// Input:  a list of chapters, lessons or any other items with at least "id" and "name".
// Output: result: {
//     positionOptions: [
//         {index: 0, name: "1: "Teorema împărțirii cu rest (TIR)""},
//         {index: 1, name: "2: (după) "Lectia 1""},
//         {index: 2, name: "3: (după) "Lectia 2""}
//     ],
//     selectedPosition: 0
// }
const getPositionOptions = (items, itemId) => {
    // Omit "itemId" in "editMode".
    const result = {
        positionOptions: [],
        selectedPosition: -1,
    };

    let positionName;
    const itemsLength = items.length;
    if (itemId) {
        // only in edit mode we have an itemId
        let indexIncrement = 0;
        items.forEach((x, index) => {
            if (index + 1 < itemsLength) {
                if (x.id === itemId) {
                    indexIncrement = 1;
                }
                positionName = `${index + 1}: (înainte de) "${items[index + indexIncrement].name}"`;
            } else {
                positionName = `${index + 1}: (ultima poziție)`;
            }

            result.positionOptions.push({ index, name: positionName });

            if (x.id === itemId) {
                result.selectedPosition = index; // select the index of the current element
            }
        });
    } else {
        items.forEach((x, index) => {
            positionName = `${index + 1}: (înainte de) "${x.name}"`;
            result.positionOptions.push({ index, name: positionName });
        });

        // Add a new position and set it as default
        result.positionOptions.push({
            index: itemsLength, // last position + 1
            name: `${itemsLength + 1}: (ultima poziție)`,
        });

        result.selectedPosition = itemsLength;
    }
    return result;
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
    const sectionsDetails = [
        {
            id: 1,
            name: "Exerciții rezolvate",
            displayNumber: 2,
        },
        {
            id: 2,
            name: "Exerciții propuse",
            displayNumber: 3,
        },
    ];

    const levelsDetails = [
        {
            id: 1,
            name: "Nivel introductiv",
        },
        {
            id: 2,
            name: "Nivel mediu",
        },
        {
            id: 3,
            name: "Nivel avansat",
        },
        {
            id: 0,
            name: "Diverse",
        },
    ];

    // initialize the section backbone (we need all sections and levels in editMode)
    const sections = [];
    sectionsDetails.forEach((s) => {
        s.total = 0;
        s.levels = [];
        levelsDetails.forEach((l) => {
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

    const exercises = exercisesRef.map((x, idx) => {
        const exercise = exercisesFromDb.find((y) => y._id.toString() === x.id);
        // add preview
        //const statementNumber = `**[R.${++idx}](/exercitii/${exercise._id})**`;
        const statementNumber = x.sectionId == 1 ? `**R${++idx}.**&nbsp;` : `**P${++idx}.**&nbsp;`;
        exerciseHelper.addPreview(exercise, statementNumber, clear);
        return exercise;
    });

    exercisesRef.forEach((e) => {
        const exercise = exercises.find((x) => x._id.toString() === e.id);

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
