const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
const katexService = require("../services/katex.service");

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
        chapterAvailableOptions,
        scopeAvailableOptions
    };

    if (isEditMode) {
        const lesson = await lessonService.getById(req.params.id);

        if (lesson.content) {
            lesson.content.textPreview = katexService.render(lesson.content.text);
        }
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
            const result = await lessonService.insertOne(lesson);
            lesson._id = result.insertedId;
        }

        //res.send(lesson);
        res.redirect(`/lectii/edit/${lesson._id}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getLessons = async (req, res) => {
    const lessons = await lessonService.getAll();

    const data = {
        lessons,
        canCreateOrEditLesson: await autz.can(req.user, "create-or-edit:lesson")
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
