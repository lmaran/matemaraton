const courseService = require("../services/course.service");
const autz = require("../services/autz.service");
//const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    const isEditMode = !!lessonId;

    const course = await courseService.getOneById(courseId);

    const data = {
        isEditMode,
        positionOptions: [],
    };

    let positionPrefix = "(înainte de)";
    let positionName;
    const chapters = course.chapters || [];
    const selectedChapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (selectedChapterIndex > -1) {
        course.selectedChapter = chapters[selectedChapterIndex];
        course.selectedChapter.index = selectedChapterIndex;

        const lessons = course.selectedChapter.lessons || [];

        if (lessons) {
            const selectedLessonIndex = lessons.findIndex((x) => x.id === lessonId);
            if (selectedLessonIndex > -1) {
                course.selectedLesson = lessons[selectedLessonIndex];
                course.selectedLesson.index = selectedLessonIndex;

                if (course.selectedLesson.articles) {
                    course.selectedLesson.articles.forEach((article) => {
                        if (article.content) {
                            article.content.textPreview = markdownService.render(article.content.text);
                        }
                    });
                }
            }

            lessons.forEach((x, index) => {
                const incIndex = index + 1;
                if (x.id === lessonId) {
                    data.selectedPosition = index; // select the index of the current element
                    positionPrefix = "(după)";
                    positionName = `${incIndex}: "${x.name}"`;
                } else {
                    positionName = `${incIndex}: ${positionPrefix} "${x.name}"`;
                }
                data.positionOptions.push({ index, name: positionName });
            });
        }
    }

    data.course = course;

    res.send(data);
    //res.render("course-theory/course-theory-create-or-edit", data);
};
