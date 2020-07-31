const course2Service = require("../services/course2.service");
const lessonService = require("../services/lesson.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");

exports.getCourses = async (req, res) => {
    const courses = await course2Service.getAll();

    const activeCourses = [];
    const archivedCourses = [];
    courses.forEach(course => {
        if (course.isActive) {
            activeCourses.push(course);
        } else {
            archivedCourses.push(course);
        }
    });

    const data = {
        activeCourses,
        archivedCourses
    };
    //res.send(data);
    res.render("course2/courses", data);
};

exports.getCourse = async (req, res) => {
    const courseId = req.params.id;
    const course = await course2Service.getById(courseId);

    // 1. create a list of all unique lessonIds used in this course
    if (course.agenda) {
        const lessonsIds = [];
        course.agenda.forEach(item => {
            this.addLessonsIdsRecursively(item, lessonsIds);
        });
        const uniqueLessonsIds = [...new Set(lessonsIds)]; // remove duplicates (if exists)

        // 2. get details (_id + name) for each lesson
        const lessons = await lessonService.getLessonNamesByIds(uniqueLessonsIds);
        const lessonsObj = arrayHelper.arrayToObject(lessons, "_id");

        // 3. add lessonName for each lesson
        course.agenda.forEach(item => {
            this.addLessonNameRecursively(item, lessonsObj);
        });
    }

    const data = {
        course
    };
    //res.send(data);
    res.render("course2/course", data);
};

exports.addLessonsIdsRecursively = (item, result) => {
    if (item.lessonId) {
        result.push(item.lessonId);
    } else {
        if (item.folderItems) {
            item.folderItems.forEach(item => {
                this.addLessonsIdsRecursively(item, result);
            });
        }
    }
};

exports.addLessonNameRecursively = (item, lessonsObj) => {
    if (item.lessonId) {
        const lesson = lessonsObj[item.lessonId];
        if (lesson) {
            item.lessonName = lesson.name;
        }
    } else {
        if (item.folderItems) {
            item.folderItems.forEach(item => {
                this.addLessonNameRecursively(item, lessonsObj);
            });
        }
    }
};
