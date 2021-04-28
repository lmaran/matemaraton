const contestService = require("../services/contest.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const contestHelper = require("../helpers/contest.helper");

exports.getAll = async (req, res) => {
    const contests = await contestService.getAll();

    const data = {
        contests,
        canCreateOrEditContest: await autz.can(req.user, "create-or-edit:contest"),
    };
    contests.forEach((contest) => {
        contest.newCode = contestHelper.getNewCode(contest); // 37 -> 5.OL.37
    });
    //res.send(data);
    res.render("contest/contest-list", data);
};

exports.getOneById = async (req, res) => {
    const contestId = req.params.contestId;
    const contest = await contestService.getOneById(contestId);
    contest.newCode = contestHelper.getNewCode(contest); // 37 -> 5.OL.37

    if (contest.exercises) {
        const ids = contest.exercises.map((x) => x.id);
        contest.exercises = await exerciseService.getAllByIds(ids);

        contest.exercises.forEach((exercise, i) => {
            // const statement = `**[E.${exercise.code}.](/exercitii/${exercise._id})** ${exercise.question.statement.text}`;
            const statement = `**[Problema ${++i}.](/concursuri/${contestId}/exercitii/${exercise._id})** ${exercise.question.statement.text}`;
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
            if (exercise.question.answer.text) {
                exercise.question.answer.textPreview = markdownService.render(`**Răspuns:** ${exercise.question.answer.text}`);
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

    const data = {
        contest,
        // course,
        canCreateOrEditContest: await autz.can(req.user, "create-or-edit:contest"),
        canDeleteContest: await autz.can(req.user, "delete:contest"),
    };
    //res.send(data);
    res.render("contest/contest", data);
};

exports.createOrEditGet = async (req, res) => {
    const contestId = req.params.contestId;
    const canCreateOrEditContest = await autz.can(req.user, "create-or-edit:contest");
    if (!canCreateOrEditContest) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!contestId;

    const gradeAvailableOptions = [
        { text: "Clasa a V-a", value: "5" },
        { text: "Clasa a VI-a", value: "6" },
        { text: "Clasa a VII-a", value: "7" },
        { text: "Clasa a VIII-a", value: "8" },
    ];

    const contestTypeAvailableOptions = [
        { text: "Olimpiadă, etapa locală", value: "olimpiada-locala" },
        { text: "Olimpiadă, etapa județeană", value: "olimpiada-judeteana" },
        { text: "Olimpiadă, etapa națională", value: "olimpiada-nationala" },
        { text: "Alte concursuri", value: "alte-concursuri" },
    ];

    const data = {
        isEditMode,
        gradeAvailableOptions,
        contestTypeAvailableOptions,
    };

    if (isEditMode) {
        const contest = await contestService.getOneById(contestId);
        contest.newCode = contestHelper.getNewCode(contest); // 37 -> 5.OL.37
        data.contest = contest;
    }

    //res.send(data);
    res.render("contest/contest-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    const contestId = req.params.contestId;
    try {
        const canCreateOrEditContest = await autz.can(req.user, "create-or-edit:contest");
        if (!canCreateOrEditContest) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const { grade, contestType, name } = req.body;
        const isEditMode = !!contestId;

        const contest = {
            grade,
            contestType,
            name,
        };

        if (isEditMode) {
            contest._id = contestId;
            contestService.updateOne(contest);
        } else {
            contest.code = await idGeneratorMongoService.getNextId("contests");
            const result = await contestService.insertOne(contest);
            contest._id = result.insertedId;
        }

        res.redirect(`/concursuri`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const contestId = req.body.contestId;
    const canDeleteContest = await autz.can(req.user, "delete:contest");
    if (!canDeleteContest) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const contest = await contestService.getOneById(contestId);
    if (contest.exercises && contest.exercises.length > 0) {
        return res.status(403).send("Șterge întâi exercițiile!");
    }
    contestService.deleteOneById(contestId);
    res.redirect("/concursuri");
};
