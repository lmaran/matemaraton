//const course2Service = require("../services/course2.service");
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
    const id = req.params.id;
    const lesson = await lessonService.getById(id);

    const data = {
        lesson
    };
    //res.send(data);
    res.render("lesson/lesson", data);
};
