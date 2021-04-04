const courseService = require("../services/course.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;

    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    const isEditMode = !!chapterId;

    const course = await courseService.getOneById(courseId);

    const data = {
        isEditMode,
        positionOptions: [],
        //selectedPosition: "first-position",
    };

    let positionPrefix = "(înainte de)";
    let positionName;
    const chapters = course.chapters || [];

    if (isEditMode) {
        const selectedChapterIndex = chapters.findIndex((x) => x.id === chapterId);
        if (selectedChapterIndex > -1) {
            course.selectedChapter = chapters[selectedChapterIndex];
            course.selectedChapter.index = selectedChapterIndex;
        }

        chapters.forEach((x, index) => {
            const incIndex = index + 1;
            if (x.id === chapterId) {
                data.selectedPosition = index; // select the index of the ccurrent element
                positionPrefix = "(după)";
                positionName = `${incIndex}: "${x.name}"`;
            } else {
                positionName = `${incIndex}: ${positionPrefix} "${x.name}"`;
            }
            data.positionOptions.push({ index, name: positionName });
        });
    } else {
        chapters.forEach((x, index) => {
            const incIndex = index + 1;
            positionName = `${incIndex}: ${positionPrefix} "${x.name}"`;
            data.positionOptions.push({ index, name: positionName });
        });
        data.positionOptions.push({
            index: chapters.length, // last position + 1
            name: `${++data.positionOptions.length}: (ultima poziție)`,
        });
        data.selectedPosition = data.positionOptions[data.positionOptions.length - 1].index; // select the id of the last element
    }

    data.course = course;

    //res.send(data);
    res.render("course-chapter/course-chapter-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const isEditMode = !!chapterId;

        const { name, description, isHidden, position } = req.body;

        const chapter = {
            name,
            description,
            isHidden,
        };

        const course = await courseService.getOneById(courseId);

        course.chapters = course.chapters || [];
        if (isEditMode) {
            const chapterIndex = course.chapters.findIndex((x) => x.id === chapterId);
            if (chapterIndex > -1) {
                const existingChapter = course.chapters[chapterIndex];
                existingChapter.name = chapter.name;
                existingChapter.description = chapter.description;

                if (chapter.isHidden === "on") {
                    // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                    existingChapter.isHidden = true;
                } else {
                    delete existingChapter.isHidden;
                }

                // move the chapter from one position (index) to another
                if (position != chapterIndex && position > -1 && position < course.chapters.length) {
                    arrayHelper.move(course.chapters, chapterIndex, position);
                }
            }
        } else {
            chapter.id = courseService.getObjectId().toString();

            if (chapter.isHidden === "on") {
                // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                chapter.isHidden = true;
            }

            if (position > -1 && position < course.chapters.length) {
                course.chapters.splice(position, 0, chapter); // insert at the specified index
            } else {
                course.chapters.push(chapter);
            }
        }
        courseService.updateOne(course);

        //res.send(course);
        res.redirect(`/cursuri/${course._id}`);
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
        courseService.updateOne(course);
    }

    res.redirect(`/cursuri/${courseId}`);
};
