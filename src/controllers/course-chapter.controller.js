const courseService = require("../services/course.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");

const hljs = require("highlight.js/lib/core");
hljs.registerLanguage("json", require("highlight.js/lib/languages/json"));

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

    const chapterIndex = chapters.findIndex((x) => x.id === chapterId);
    let chapter = {};
    if (chapterIndex > -1) {
        chapter = chapters[chapterIndex];
    }

    // if (course && course.chapters) {
    //     course.chapters.forEach((chapter) => {
    //         chapter.numberOfActiveLessons = 0;
    //         if (chapter.lessons) {
    //             chapter.lessons.forEach((lesson) => {
    //                 lesson.isActive = !!(lesson.exercises?.length || lesson.theory?.text);
    //                 if (lesson.isActive) chapter.numberOfActiveLessons++;
    //             });
    //         }
    //     });
    // }

    if (chapter.lessons) {
        chapter.lessons.forEach((lesson) => {
            lesson.isActive = !!(lesson.exercises?.length || lesson.theory?.text);
        });
    }

    const data = {
        courseId,
        courseCode: course.code,
        chapter,
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

    // 1. format (indent, new lines)
    // it requires <pre>, <code> and 2 curly braces: "<pre><code>{{formattedExercise}}</code></pre>""
    const courseChapterAsJson = JSON.stringify(course, null, 4);

    // 2. highlight (inject html tags in order to support colors, borders etc)
    // it requires <pre>, <code> and 3 curly braces: "<pre><code>{{prettyExercise}}</code></pre>""
    const courseChapterAsPrettyJson = hljs.highlight(courseChapterAsJson, { language: "json" }).value;

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
