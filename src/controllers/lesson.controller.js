const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
//const arrayHelper = require("../helpers/array.helper");

exports.deleteLesson = async (req, res) => {
    const canDeleteLesson = await autz.can(req.user, "delete:lesson");
    if (!canDeleteLesson) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    lessonService.deleteOne(req.body._id);
    res.redirect("/lectii");
};

exports.createOrEditLessonGet = async (req, res) => {
    const canCreateOrEditLesson = await autz.can(req.user, "create-or-edit:lesson");
    if (!canCreateOrEditLesson) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!req.params.id;

    // // const availableGrades = ["P", "5", "6", "7", "8", "9", "10", "11", "12"];
    const gradeAvailableOptions = [
        { text: "Primar", value: "P" },
        { text: "Clasa a V-a", value: "5" },
        { text: "Clasa a VI-a", value: "6" }
    ];

    const branchAvailableOptions = [
        { text: "Algebră", value: "algebra" },
        { text: "Geometrie", value: "geometrie" },
        { text: "Analiză matematică", value: "analiza" }
    ];

    // const contestTypeAvailableOptions = [
    //     { text: "Olimpiadă, etapa locală", value: "olimpiada-locala" },
    //     { text: "Olimpiadă, etapa județeană", value: "olimpiada-judeteana" },
    //     { text: "Olimpiadă, etapa națională", value: "olimpiada-nationala" },
    //     { text: "Evaluare Națională", value: "evaluare-nationala" },
    //     { text: "Simulare Evaluare Națională", value: "simulare-evaluare-nationala" },
    //     { text: "Alte concursuri", value: "alte-concursuri" }
    // ];

    // const sourceTypeAvailableOptions = [
    //     { text: "Gazeta Matematică (GM)", value: "gazeta-matematica" },
    //     { text: "Revista de Matematică din Timișoara (RMT)", value: "revista-matematică-tm" },
    //     { text: "Culegere 'Teme supliment Gazeta Matematică'", value: "teme-supliment-gazeta-matematica" },
    //     { text: "Culegere 'Mate2000 excelență'", value: "mate2000-excelenta" },
    //     {
    //         text: "Culegere 'Matematică pt. olimpiade și concursuri', N. Grigore",
    //         value: "mate-olimpiade-ngrigore"
    //     },
    //     {
    //         text: "Culegere 'Exerciții pt. cercurile de matematică', P. Năchilă",
    //         value: "cercuri-mate-pnachila"
    //     },
    //     { text: "Culegere 'Mate2000 consolidare'", value: "mate2000-consolidare" },
    //     { text: "Culegere 'Evaluarea Națională', Ed. Paralela 45", value: "evaluare-nationala-p45" },
    //     { text: "Alte surse", value: "alte-surse" }
    // ];

    const chapterAvailableOptions = [
        { text: "Numere Raționale", value: "numere-rationale" },
        { text: "Numere Reale", value: "numere-reale" }
    ];

    const scopeAvailableOptions = [
        { text: "Evaluări la clasă și Examene Naționale", value: "clasa" },
        { text: "Olimpiade și Concursuri", value: "olimpiada" }
    ];

    const data = {
        isEditMode,
        gradeAvailableOptions,
        branchAvailableOptions,
        // contestTypeAvailableOptions,
        // sourceTypeAvailableOptions,
        chapterAvailableOptions,
        scopeAvailableOptions
    };

    if (isEditMode) {
        const lesson = await lessonService.getById(req.params.id);

        // lesson.textPreview = md.render(lesson.text);

        data.lesson = lesson;
    }

    //res.send(data);
    res.render("lesson/lesson-create-or-edit", data);
};

exports.createOrEditLessonPost = async (req, res) => {
    try {
        const canCreateOrEditLesson = await autz.can(req.user, "create-or-edit:lesson");
        if (!canCreateOrEditLesson) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const { _id, grade, scope, branch, chapter, title, content } = req.body;
        const isEditMode = !!_id;

        const lesson = {
            grade,
            scope,
            branch,
            chapter,
            title,
            content: { text: content }
        };

        if (isEditMode) {
            lesson._id = _id;
            lessonService.updateOne(lesson);
        } else {
            //exercise.code = await idGeneratorMongoService.getNextId("exercises");
            lessonService.insertOne(lesson);
        }

        res.send(lesson);
        //res.redirect(`/lectii/edit/${lesson._id}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

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
        lessons,
        canCreateOrEditLesson: await autz.can(req.user, "create-or-edit:lesson")
        // activeCourses,
        // archivedCourses
    };
    //res.send(data);
    res.render("lesson/lesson-list", data);
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
        course,
        canCreateOrEditLesson: await autz.can(req.user, "create-or-edit:lesson")
    };
    // res.send(data);
    res.render("lesson/lesson", data);
};
