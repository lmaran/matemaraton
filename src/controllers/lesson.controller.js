const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
//const arrayHelper = require("../helpers/array.helper");

exports.getLessons = async (req, res) => {
    const lessons = await lessonService.getAll();

    // const activeCourses = [];
    // const archivedCourses = [];
    // courses.forEach(course => {
    //     if (course.isActive) {
    //         activeCourses.push(course);
    //     } else {
    //         archivedCourses.push(course);
    //     }
    // });

    const data = {
        lessons
        // activeCourses,
        // archivedCourses
    };
    //res.send(data);
    res.render("lesson/lessons", data);
};

exports.getLesson = async (req, res) => {
    const lessonId = req.params.lessonId;
    const courseId = req.params.courseId;

    let lesson, course;
    if (courseId) {
        [lesson, course] = await Promise.all([
            await lessonService.getById(lessonId),
            await courseService.getById(courseId)
        ]);
    } else {
        lesson = await lessonService.getById(lessonId);
    }

    const data = {
        lesson,
        course
    };
    // res.send(data);
    res.render("lesson/lesson", data);
};
