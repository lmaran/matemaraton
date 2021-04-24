const practiceTestService = require("../services/practice-test.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");

exports.getAll = async (req, res) => {
    const practiceTests = await practiceTestService.getAll();

    const data = {
        practiceTests,
        canCreateOrEditPracticeTest: await autz.can(req.user, "create-or-edit:practice-test"),
    };
    //res.send(data);
    res.render("practice-test/practice-test-list", data);
};

exports.getOneById = async (req, res) => {
    const practiceTestId = req.params.practiceTestId;
    const practiceTest = await practiceTestService.getOneById(practiceTestId);

    if (practiceTest.exercises) {
        const ids = practiceTest.exercises.map((x) => x.id);
        practiceTest.exercises = await exerciseService.getAllByIds(ids);

        practiceTest.exercises.forEach((exercise, i) => {
            // const statement = `**[E.${exercise.code}.](/exercitii/${exercise._id})** ${exercise.question.statement.text}`;
            const statement = `**[Problema ${++i}.](/exercitii/${exercise._id})** ${exercise.question.statement.text}`;
            const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

            if (exercise.question.answerOptions) {
                exercise.question.answerOptions.forEach((answerOption, idx) => {
                    // insert a label (letter) in front of each option: "a" for the 1st option, "b" for the 2nd a.s.o.
                    answerOption.textPreview = markdownService.render(`${alphabet[idx]}) ${answerOption.text}`);
                    if (answerOption.isCorrect) {
                        exercise.question.correctAnswerPreview = markdownService.render(`**Răspuns:** ${answerOption.text}`);
                    }
                });
            }

            exercise.question.statement.textPreview = markdownService.render(statement);

            if (exercise.question.solution) {
                //exercise.question.solution.textPreview = markdownService.render(`**Soluție:** ${exercise.question.solution.text}`);
                exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);
            }
            if (exercise.question.hints) {
                exercise.question.hints.forEach((hint, idx) => {
                    hint.textPreview = markdownService.render(`**Hint ${idx + 1}:** ${hint.text}`);
                });
            }
        });
    }

    //const courseId = req.params.courseId;

    // let lesson, course;
    // if (courseId) {
    //     [lesson, course] = await Promise.all([
    //         await lessonService.getOneById(lessonId),
    //         await courseService.getOneById(courseId)
    //     ]);
    // } else {
    //     lesson = await lessonService.getOneById(lessonId);
    // }

    const data = {
        practiceTest,
        // course,
        canCreateOrEditPracticeTest: await autz.can(req.user, "create-or-edit:practice-test"),
        canDeletePracticeTest: await autz.can(req.user, "delete:practice-test"),
    };
    //res.send(data);
    res.render("practice-test/practice-test-view", data);
};

exports.createOrEditGet = async (req, res) => {
    const practiceTestId = req.params.practiceTestId;
    const canCreateOrEditPracticeTest = await autz.can(req.user, "create-or-edit:practice-test");
    if (!canCreateOrEditPracticeTest) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!practiceTestId;

    const gradeAvailableOptions = [
        { text: "Primar", value: "P" },
        { text: "Clasa a V-a", value: "5" },
        { text: "Clasa a VI-a", value: "6" },
    ];

    const scopeAvailableOptions = [
        { text: "Evaluări la clasă și Examene Naționale", value: "clasa" },
        { text: "Olimpiade și Concursuri", value: "olimpiada" },
    ];

    const data = {
        isEditMode,
        gradeAvailableOptions,
        scopeAvailableOptions,
    };

    if (isEditMode) {
        const practiceTest = await practiceTestService.getOneById(practiceTestId);
        data.practiceTest = practiceTest;
    }

    //res.send(data);
    res.render("practice-test/practice-test-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    const practiceTestId = req.params.practiceTestId;
    try {
        const canCreateOrEditPracticeTest = await autz.can(req.user, "create-or-edit:practice-test");
        if (!canCreateOrEditPracticeTest) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const { grade, scope, name } = req.body;
        const isEditMode = !!practiceTestId;

        const practiceTest = {
            grade,
            scope,
            name,
        };

        if (isEditMode) {
            practiceTest._id = practiceTestId;
            practiceTestService.updateOne(practiceTest);
        } else {
            const result = await practiceTestService.insertOne(practiceTest);
            practiceTest._id = result.insertedId;
        }

        res.redirect(`/teste`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const practiceTestId = req.body._id;
    const canDeletePracticeTest = await autz.can(req.user, "delete:practice-test");
    if (!canDeletePracticeTest) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const practiceTest = await practiceTestService.getOneById(practiceTestId);
    if (practiceTest.exercises && practiceTest.exercises.length > 0) {
        return res.status(403).send("Șterge întâi exercițiile!");
    }
    practiceTestService.deleteOneById(req.body._id);
    res.redirect("/teste");
};
