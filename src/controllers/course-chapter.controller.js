const courseService = require("../services/course.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;

    const isEditMode = !!chapterId;

    let courseCode, chapterRef, chapterIndex, availablePositions, selectedPosition;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");
        courseCode = course.code;

        if (isEditMode) {
            chapterRef = (course.chapters || []).find((x) => x.id === chapterId);
            if (!chapterRef) return res.status(500).send("Capitol negăsit!");
            chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);
        }

        // in editMode, chapterId will be undefined (falsy)
        // The parentheses ( ... ) around the assignment statement are required when using object literal destructuring assignment without a declaration.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(course.chapters, chapterId));

        const data = {
            isEditMode,
            courseId,
            courseCode,

            chapterId,
            chapterIndex,
            chapter: chapterRef,

            availablePositions,
            selectedPosition,
        };

        //res.send(data);
        res.render("course-chapter/course-chapter-create-or-edit", data);
    } catch (err) {
        console.log(err);
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

        arrayHelper.moveOrInsertAtIndex(course.chapters, chapter, "id", position);

        courseService.updateOne(course);

        //res.send(course);
        res.redirect(`/cursuri/${courseId}/capitole/${chapterId}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const course = await courseService.getOneById(courseId);
    const chapters = course.chapters || [];

    const selectedChapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (selectedChapterIndex > -1) {
        course.selectedChapter = chapters[selectedChapterIndex];
        course.selectedChapter.index = selectedChapterIndex;
    }

    const data = {
        course,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };

    //res.send(data);
    res.render("course-chapter/course-chapter", data);
};

exports.deleteOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;

    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const course = await courseService.getOneById(courseId);
    const chapters = course.chapters || [];

    const chapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (chapterIndex > -1) {
        const chapter = chapters[chapterIndex];

        if (chapter.lessons && chapter.lessons.length > 0) {
            return res.status(403).send("Șterge întâi lecțiile!");
        }

        chapters.splice(chapterIndex, 1); // remove from array

        const updateResult = await courseService.updateOne(course);

        // delete also the exercise content
        if (updateResult.modifiedCount != 1) return res.status(403).send("Șterge întâi lecțiile!");
    }

    res.redirect(`/cursuri/${courseId}/modifica`);
};