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

    const lessons = await lessonService.getByIds(course.lessonsIds);

    const lessonsByAreaObj = arrayHelper.groupBy(lessons, "area");

    // lessonsTree: {
    //     teoria-numerelor: {
    //         numere-intregi: [
    //             {
    //                 _id: "5f21cf3ae0e6246b5ca2e2f7",
    //                 scope: "olimpiada",
    //                 clasa: "7",
    //                 area: "teoria-numerelor",
    //                 chapter: "numere-intregi",
    //                 title: "Ecuații diofantice"
    //             }
    //         ],
    //         numere-rationale: [{...}]
    //     },
    //     geometrie: {
    //         Triunghiul: [{..}]
    //     }
    // }
    const lessonsTree = {};
    Object.keys(lessonsByAreaObj).forEach(key => {
        const areaValues = lessonsByAreaObj[key];
        const areaValuesByChapter = arrayHelper.groupBy(areaValues, "chapter");
        lessonsTree[key] = areaValuesByChapter;
    });

    const data = {
        course,
        lessonsTree
    };
    //res.send(data);
    res.render("course2/course", data);
};
