const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");

exports.createOrEditGet = async (req, res) => {
    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    const isEditMode = !!req.params.id;

    const gradeAvailableOptions = [
        { text: "Primar", value: "P" },
        { text: "Clasa a V-a", value: "5" },
        { text: "Clasa a VI-a", value: "6" },
        { text: "Clasa a VII-a", value: "7" },
        { text: "Clasa a VIII-a", value: "8" },
    ];

    const categoryAvailableOptions = [
        { text: "Evaluare Națională", value: "Evaluare Națională" },
        { text: "Olimpiadă", value: "Olimpiadă" },
        { text: "Altă categorie", value: "Altă categorie" },
    ];

    const data = {
        isEditMode,
        gradeAvailableOptions,
        categoryAvailableOptions,
    };
    //let classId;
    if (isEditMode) {
        const course = await courseService.getOneById(req.params.id);
        //await this.addLessonDetailsAsync(course);
        //classId = courseSession.classId;
        data.course = course;
    } else {
        // classId = req.params.classId;
        // const numberOfSessionForClass = await courseSessionService.getNumberOfSessionForClass(classId);
        // data.courseSession = {
        //     course: numberOfSessionForClass + 1,
        //     date: dateTimeHelper.getShortDate(new Date()),
        // };
    }
    // const [cls, studentsMapByClassId] = await Promise.all([
    //     await classService.getOneById(classId),
    //     await studentsAndClassesService.getStudentsMapByClassId(classId),
    // ]);
    // const allStudentsIdsPerClass = studentsMapByClassId.map((x) => x.studentId);
    // data.class = cls;
    // const allStudentsPerClass = await personService.getAllByIds(allStudentsIdsPerClass);
    // // add abandon info
    // allStudentsPerClass.forEach((student) => {
    //     student.isNotDroppedOut = studentsMapByClassId.find(
    //         (x) => x.studentId == student._id.toString() && !x.droppedOut
    //     );
    // });
    // // add presence info
    // if (data.courseSession.studentsIds) {
    //     allStudentsPerClass.forEach((student) => {
    //         student.isPresent = data.courseSession.studentsIds.includes(student._id.toString());
    //     });
    // }
    // data.students = allStudentsPerClass;
    //res.send(data);
    res.render("course/course-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const isEditMode = !!req.params.id;

        const { id, code, name, description, grade, level } = req.body;

        const course = {
            code,
            name,
            description,
            grade,
            level,
        };

        if (isEditMode) {
            course._id = id;
            courseService.updateOne(course);
        } else {
            const result = await courseService.insertOne(course);
            course._id = result.insertedId;
        }
        //res.send(course);
        res.redirect(`/cursuri/${course._id}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
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
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };
    //res.send(data);
    res.render("course/courses", data);
};

exports.getOneById = async (req, res) => {
    const courseId = req.params.id;
    const course = await courseService.getOneById(courseId);

    const data = {
        course,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };
    //res.send(data);
    res.render("course/course", data);
};

exports.deleteOneById = async (req, res) => {
    const courseId = req.params.id;

    const canDelete = await autz.can(req.user, "delete:course");
    if (!canDelete) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const course = await courseService.getOneById(courseId);
    if (course.chapters && course.chapters.length > 0) {
        return res.status(403).send("Șterge întâi capitolele!");
    }

    courseService.deleteOneById(req.body.id);
    res.redirect(`/cursuri`);
};

// exports.addLessonDetailsAsync = async (course) => {
//     const lessonsIds = [];
//     if (course.chapters) {
//         course.chapters.forEach((chapter) => {
//             if (chapter.lessons) {
//                 chapter.lessons.forEach((lesson) => {
//                     if (lesson.id) {
//                         lessonsIds.push(lesson.id);
//                     }
//                 });
//             }
//         });

//         const uniqueLessonsIds = [...new Set(lessonsIds)]; // remove duplicates (if exists)

//         // get lesson details
//         const lessons = await lessonService.getLessonTitlesByIds(uniqueLessonsIds);

//         // enrich TOC with lesson names
//         course.chapters.forEach((chapter) => {
//             if (chapter.lessons) {
//                 chapter.lessons.forEach((lesson) => {
//                     if (lesson.id) {
//                         const lesson3 = lessons.find((x) => x._id == lesson.id);
//                         lesson.name = lesson3.title;
//                     }
//                 });
//             }
//         });
//     }
// };

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
