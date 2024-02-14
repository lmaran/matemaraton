const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.createOrEditGet = async (req, res) => {
    const { courseId, chapterId } = req.params;

    const isEditMode = !!chapterId;

    let isLessonsTabActive, isGeneralTabActive;
    if (isEditMode) {
        const { view } = req.query;
        isLessonsTabActive = view != "general";
        isGeneralTabActive = view == "general";
    } else {
        isLessonsTabActive = false;
        isGeneralTabActive = true;
    }

    let chapterRef, chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        if (isEditMode) {
            chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
            if (!chapterRef) return res.status(500).send("Capitol negăsit!");
            chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);

            if (chapterRef.lessonIds) {
                const allLessonsFromDB = await lessonService.getAllByIds(chapterRef.lessonIds);

                chapterRef.lessonIds.forEach((lessonId) => {
                    const lesson = allLessonsFromDB.find((x) => x._id.toString() == lessonId);

                    // TODO: fetch from DB only those fields we really need (e.g. no Theory, only the total number of exercises etc)
                    if (lesson) {
                        const newLesson = {
                            id: lesson._id.toString(),
                            name: lesson.name,
                            exercises: lesson.exercises,
                            isActive: !!(lesson.exercises?.length || lesson.theory?.text),
                        };

                        if (newLesson.isActive) chapterRef.numberOfActiveLessons++;

                        chapterRef.lessons = chapterRef.lessons || [];
                        chapterRef.lessons.push(newLesson);
                    }
                });
            }
        }

        // in editMode, chapterId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(course.chapters, chapterId));

        const data = {
            isLessonsTabActive,
            isGeneralTabActive,
            isEditMode,
            courseId,
            courseCode: course.code,

            chapterId,
            chapterIndex,
            chapter: chapterRef,

            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("course-chapter/course-chapter-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditPost = async (req, res) => {
    const { courseId, name, description, isHidden, position } = req.body;
    let { chapterId } = req.params;
    let chapter;

    const isEditMode = !!chapterId;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        if (isEditMode) {
            chapter = (course.chapters || []).find((x) => x.id === chapterId);
            if (!chapter) return res.status(500).send("Capitol negăsit!");
        } else {
            // new lesson
            chapterId = courseService.getObjectId().toString();
            chapter = {
                id: chapterId,
            };
        }

        // update chapter fields
        chapter.name = name;
        chapter.description = description;

        if (isHidden === "on") {
            // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
            chapter.isHidden = true;
        } else delete chapter.isHidden;

        course.chapters = course.chapters || [];

        arrayHelper.moveOrInsertObjectAtIndex(course.chapters, chapter, "id", position);

        courseService.updateOne(course);

        //res.send(course);
        if (isEditMode) res.redirect(`/cursuri/${courseId}/capitole/${chapterId}/modifica`);
        else res.redirect(`/cursuri/${courseId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getOneById = async (req, res) => {
    const { courseId, chapterId } = req.params;

    const course = await courseService.getOneById(courseId);
    const chapters = course.chapters || [];

    const chapterIndex = chapters.findIndex((x) => x.id === chapterId);

    if (chapterIndex == -1) return res.status(500).send("Capitol negăsit!");

    const chapterRef = chapters[chapterIndex];

    if (chapterRef.lessonIds) {
        const allLessonsFromDB = await lessonService.getAllByIds(chapterRef.lessonIds);

        chapterRef.lessonIds.forEach((lessonId) => {
            const lesson = allLessonsFromDB.find((x) => x._id.toString() == lessonId);

            // TODO: fetch from DB only those fields we really need (e.g. no Theory, only the total number of exercises etc)
            if (lesson) {
                const newLesson = {
                    id: lesson._id.toString(),
                    name: lesson.name,
                    exercises: lesson.exercises,
                    isActive: !!(lesson.exercises?.length || lesson.theory?.text),
                };

                if (newLesson.isActive) chapterRef.numberOfActiveLessons++;

                chapterRef.lessons = chapterRef.lessons || [];
                chapterRef.lessons.push(newLesson);
            }
        });
    }

    const data = {
        courseId,
        courseCode: course.code,
        chapter: chapterRef,
        chapterIndex,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };

    //res.send(data);
    res.render("course-chapter/course-chapter", data);
};

exports.jsonGetOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const course = await courseService.getOneById(courseId);
    const chapters = course.chapters || [];

    const chapterIndex = chapters.findIndex((x) => x.id === chapterId);
    let chapter = {};
    if (chapterIndex > -1) {
        chapter = chapters[chapterIndex];
    }

    // keep only the current chapter and current lesson
    course.chapters = course.chapters.filter((x) => x.id == chapter.id);

    const courseChapterAsPrettyJson = prettyJsonHelper.getPrettyJson(course);

    const data = {
        courseId,
        courseCode: course.code,
        courseChapterAsPrettyJson,
        chapterIndex,
        chapterId: chapter.id,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };

    //res.send(data);
    res.render("course-chapter/course-chapter-json", data);
};

exports.deleteOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;

    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const course = await courseService.getOneById(courseId);
    const chapter = (course.chapters || []).find((x) => x.id == chapterId);

    if (chapter.lessonIds && chapter.lessonIds.length > 0) {
        return res.status(403).send("Șterge întâi lecțiile!");
    }

    course.chapters = (course.chapters || []).filter((x) => x.id != chapterId); // remove the chapter from array
    await courseService.updateOne(course);

    res.redirect(`/cursuri/${courseId}/modifica`);
};
