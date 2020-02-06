const courseService = require("../services/course.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");

exports.getCoursesPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses] = await Promise.all([
        await classService.getClassById(classId),
        await courseService.getCoursesByClassId(classId)
    ]);

    const newCourses = courses
        .filter(x => !x.noCourse)
        .map(x => {
            x.dateAsString = dateTimeHelper.getStringFromStringNoDay(x.date);
            return x;
        });

    const data = {
        class: cls,
        courses: newCourses,
        totalCourses: newCourses.length
    };
    //res.send(data);
    res.render("course/courses-per-class", data);
};

exports.getCourse = async (req, res) => {
    const courseId = req.params.courseId;

    const course = await courseService.getCourseById(courseId);

    course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);

    const data = {
        course
    };
    //res.send(data);
    res.render("course/course", data);
};