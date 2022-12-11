const courseService = require("../services/course.service");
//const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;
    const articleId = req.params.articleId;

    const canCreateOrEditCourse = await autz.can(
        req.user,
        "create-or-edit:course"
    );
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    const isEditMode = !!articleId;

    const course = await courseService.getOneById(courseId);

    const data = {
        isEditMode,
        positionOptions: [],
    };

    // let positionPrefix = "(înainte de)";
    // let positionName;
    const chapters = course.chapters || [];
    const selectedChapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (selectedChapterIndex > -1) {
        course.selectedChapter = chapters[selectedChapterIndex];
        course.selectedChapter.index = selectedChapterIndex;

        const lessons = course.selectedChapter.lessons || [];

        const selectedLessonIndex = lessons.findIndex((x) => x.id === lessonId);
        if (selectedLessonIndex > -1) {
            course.selectedLesson = lessons[selectedLessonIndex];
            course.selectedLesson.index = selectedLessonIndex;
        }

        // if (isEditMode) {
        //     // lessons.forEach((x, index) => {
        //     //     //const incIndex = index + 1;
        //     //     // if (x.id === lessonId) {
        //     //     //     data.selectedPosition = index; // select the index of the ccurrent element
        //     //     //     positionPrefix = "(după)";
        //     //     //     positionName = `${incIndex}: "${x.name}"`;
        //     //     // } else {
        //     //     //     positionName = `${incIndex}: ${positionPrefix} "${x.name}"`;
        //     //     // }
        //     //     // data.positionOptions.push({ index, name: positionName });
        //     // });
        // } else {
        //     // lessons.forEach((x, index) => {
        //     //     // const incIndex = index + 1;
        //     //     // positionName = `${incIndex}: ${positionPrefix} "${x.name}"`;
        //     //     // data.positionOptions.push({ index, name: positionName });
        //     // });
        //     // data.positionOptions.push({
        //     //     index: chapters.length, // last position + 1
        //     //     name: `${++data.positionOptions.length}: (ultima poziție)`,
        //     // });
        //     // data.selectedPosition = data.positionOptions[data.positionOptions.length - 1].index; // select the id of the last element
        // }
    }

    data.course = course;

    //res.send(data);
    res.render("course-article/course-article-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;
    const articleId = req.params.articleId;

    try {
        const canCreateOrEditCourse = await autz.can(
            req.user,
            "create-or-edit:course"
        );
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const isEditMode = !!articleId;

        const { content } = req.body;

        const article = {
            // name,
            // description,
            // isHidden,
            content: { text: content },
        };

        const course = await courseService.getOneById(courseId);
        course.chapters = course.chapters || [];

        const selectedChapterIndex = course.chapters.findIndex(
            (x) => x.id === chapterId
        );
        if (selectedChapterIndex > -1) {
            const selectedChapter = course.chapters[selectedChapterIndex];
            //selectedChapter.index = selectedChapterIndex;

            selectedChapter.lessons = selectedChapter.lessons || [];

            const selectedLessonIndex = selectedChapter.lessons.findIndex(
                (x) => x.id === lessonId
            );
            if (selectedLessonIndex > -1) {
                const selectedLesson =
                    selectedChapter.lessons[selectedLessonIndex];
                //selectedLesson.index = selectedLessonIndex;

                selectedLesson.articles = selectedLesson.articles || [];

                if (isEditMode) {
                    //const lessonIndex = course.selectedChapter.lessons.findIndex((x) => x.id === lessonId);
                    // if (lessonIndex > -1) {
                    //     const existingLesson = course.selectedChapter.lessons[lessonIndex];
                    //     existingLesson.name = lesson.name;
                    //     existingLesson.description = lesson.description;
                    //     if (lesson.isHidden === "on") {
                    //         // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                    //         existingLesson.isHidden = true;
                    //     } else {
                    //         delete existingLesson.isHidden;
                    //     }
                    //     // move the lesson from one position (index) to another
                    //     if (position != lessonIndex && position > -1 && position < course.selectedChapter.lessons.length) {
                    //         arrayHelper.move(course.selectedChapter.lessons, lessonIndex, position);
                    //     }
                    // }
                } else {
                    article.id = courseService.getObjectId().toString();

                    selectedLesson.articles.push(article);
                }
            }
        }

        courseService.updateOne(course);

        //res.send(course);
        res.redirect(
            `/cursuri/${course._id}/capitole/${chapterId}/lectii/${lessonId}`
        );
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;
    const course = await courseService.getOneById(courseId);

    const chapters = course.chapters || [];

    const selectedChapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (selectedChapterIndex > -1) {
        course.selectedChapter = chapters[selectedChapterIndex];
        course.selectedChapter.index = selectedChapterIndex;

        const lessons = course.selectedChapter.lessons;
        if (lessons) {
            const selectedLessonIndex = lessons.findIndex(
                (x) => x.id === lessonId
            );
            if (selectedLessonIndex > -1) {
                course.selectedLesson = lessons[selectedLessonIndex];
                course.selectedLesson.index = selectedLessonIndex;
            }
        }
    }

    const data = {
        course,
        canCreateOrEditCourse: await autz.can(
            req.user,
            "create-or-edit:course"
        ),
    };

    res.send(data);
    //res.render("course-lesson/course-lesson", data);
};

exports.deleteOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

    const canCreateOrEditCourse = await autz.can(
        req.user,
        "create-or-edit:course"
    );
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const course = await courseService.getOneById(courseId);
    const chapters = course.chapters || [];

    const selectedChapter = chapters.find((x) => x.id === chapterId);
    const lessons = selectedChapter.lessons || [];

    const lessonIndex = lessons.findIndex((x) => x.id === lessonId);
    if (lessonIndex > -1) {
        // const lesson = lessons[lessonIndex];

        // TODO fix it (delete only empty lessons)
        // if (lesson.lessons && chapter.lessons.length > 0) {
        //     return res.status(403).send("Șterge întâi lecțiile!");
        // }

        lessons.splice(lessonIndex, 1); // remove from array
        courseService.updateOne(course);
    }

    res.redirect(`/cursuri/${courseId}/capitole/${chapterId}`);
};
