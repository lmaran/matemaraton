const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");

exports.getCourses = async (req, res) => {
    const courses = await courseService.getAll();

    const generalCourses = [];
    const highLevelCourses = [];
    courses
        .sort((a, b) => (a.code > b.code ? 1 : -1))
        .forEach((course) => {
            if (course.level === "Evaluare Națională") {
                generalCourses.push(course);
            } else if (course.level === "Olimpiadă") {
                highLevelCourses.push(course);
            }
        });

    const data = {
        generalCourses,
        highLevelCourses,
    };
    //res.send(data);
    res.render("course/courses", data);
};

exports.getCourse = async (req, res) => {
    const courseId = req.params.id;
    const course = await courseService.getOneById(courseId);
    let uniqueLessonsIdsTmp;

    // 1. create a list of all unique lessonIds used in this course
    if (course.agenda) {
        const lessonsIds = [];
        course.agenda.forEach((item) => {
            this.addLessonsIdsRecursively(item, lessonsIds);
        });
        const uniqueLessonsIds = [...new Set(lessonsIds)]; // remove duplicates (if exists)
        //uniqueLessonsIdsTmp = uniqueLessonsIds;
        // 2. get details (_id + name) for each lesson
        const lessons = await lessonService.getLessonTitlesByIds(uniqueLessonsIds);
        const lessonsObj = arrayHelper.arrayToObject(lessons, "_id");
        uniqueLessonsIdsTmp = lessons;

        // 3. add lessonName for each lesson
        course.agenda.forEach((item) => {
            this.addLessonTitleRecursively(item, lessonsObj);
        });
    }

    const data = {
        course,
        uniqueLessonsIdsTmp,
    };
    //res.send(data);
    res.render("course/course", data);
};

exports.addLessonsIdsRecursively = (item, result) => {
    if (item.lessonId) {
        result.push(item.lessonId);
    } else {
        if (item.folderItems) {
            item.folderItems.forEach((item) => {
                this.addLessonsIdsRecursively(item, result);
            });
        }
    }
};

exports.addLessonTitleRecursively = (item, lessonsObj) => {
    if (item.lessonId) {
        const lesson = lessonsObj[item.lessonId];
        if (lesson) {
            item.lessonTitle = lesson.title;
        }
    } else {
        if (item.folderItems) {
            item.folderItems.forEach((item) => {
                this.addLessonTitleRecursively(item, lessonsObj);
            });
        }
    }
};
