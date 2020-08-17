const practiceTestService = require("../services/practice-test.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");

exports.getAll = async (req, res) => {
    const practiceTests = await practiceTestService.getAll();

    const data = {
        practiceTests,
        canCreateOrEditPracticeTest: await autz.can(req.user, "create-or-edit:practice-test")
    };
    //res.send(data);
    res.render("practice-test/practice-test-list", data);
};

exports.getOneById = async (req, res) => {
    const practiceTestId = req.params.practiceTestId;
    const practiceTest = await practiceTestService.getOneById(practiceTestId);

    //const courseId = req.params.courseId;

    // let lesson, course;
    // if (courseId) {
    //     [lesson, course] = await Promise.all([
    //         await lessonService.getById(lessonId),
    //         await courseService.getById(courseId)
    //     ]);
    // } else {
    //     lesson = await lessonService.getById(lessonId);
    // }

    const data = {
        practiceTest,
        // course,
        canCreateOrEditPracticeTest: await autz.can(req.user, "create-or-edit:practice-test")
    };
    //res.send(data);
    res.render("practice-test/practice-test-view", data);
};

exports.createOrEditGet = async (req, res) => {
    const canCreateOrEditPracticeTest = await autz.can(req.user, "create-or-edit:practice-test");
    if (!canCreateOrEditPracticeTest) {
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
        { text: "Numere Naturale", value: "numere-rationale" },
        { text: "Numere Întregi", value: "numere-intregi" },
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
        const practiceTest = await practiceTestService.getOneById(req.params.id);

        // if (practiceTest.content) {
        //     practiceTest.content.textPreview = markdownService.render(practiceTest.content.text);
        // }
        data.practiceTest = practiceTest;
    }

    //res.send(data);
    res.render("practice-test/practice-test-create-or-edit", data);
};

exports.deleteOneById = async (req, res) => {
    const canDeletePracticeTest = await autz.can(req.user, "delete:test");
    if (!canDeletePracticeTest) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    practiceTestService.deleteOneById(req.body._id);
    res.redirect("/teme");
};
