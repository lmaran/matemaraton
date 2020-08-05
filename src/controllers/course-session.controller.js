const courseSessionService = require("../services/course-session.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");

exports.getCourseSessionsPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses] = await Promise.all([
        await classService.getClassById(classId),
        await courseSessionService.getCourseSessionsByClassId(classId)
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
    res.render("course-session/course-sessions-per-class", data);
};

exports.getCourseSessionsPerClassWithPhotos = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses] = await Promise.all([
        await classService.getClassById(classId),
        await courseSessionService.getCourseSessionsByClassId(classId)
    ]);

    const newCourses = courses
        .filter(x => !x.noCourse)
        .map(x => {
            x.dateAsString = dateTimeHelper.getStringFromStringNoDay(x.date);
            x.images.forEach(image => (image.highQualityUrl = image.url.replace("courses-lg", "courses")));
            return x;
        });

    const data = {
        class: cls,
        courses: newCourses,
        totalCourses: newCourses.length
    };
    //res.send(data);
    res.render("course-session/course-sessions-with-all-photos", data);
};

exports.getCourseSession = async (req, res) => {
    const courseSessionId = req.params.courseSessionId;

    const course = await courseSessionService.getCourseSessionById(courseSessionId);
    const cls = await classService.getClassById(course.classId);

    course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);

    course.images.forEach(image => (image.highQualityUrl = image.url.replace("courses-lg", "courses")));

    const data = {
        class: cls,
        course
    };
    //res.send(data);
    res.render("course-session/course-session", data);
};
