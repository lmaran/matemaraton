const exerciseService = require("../services/exercise.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");

exports.deleteOneById = async (req, res) => {
    const canDeleteExercise = await autz.can(req.user, "delete:exercise");
    if (!canDeleteExercise) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    exerciseService.deleteOneById(req.body.id);
    res.redirect("/exercitii");
};

exports.createOrEditGet = async (req, res) => {
    const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
    if (!canCreateOrEditExercise) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!req.params.id;

    const gradeAvailableOptions = [
        { text: "Primar", value: "P" },
        { text: "Clasa a V-a", value: "5" },
        { text: "Clasa a VI-a", value: "6" },
        { text: "Clasa a VII-a", value: "7" },
        { text: "Clasa a VIII-a", value: "8" }
    ];

    const branchAvailableOptions = [
        // { text: "Aritmetică (primar)", value: "aritmetica" },
        // { text: "Algebră (gimnaziu)", value: "algebra" },
        // { text: "Geometrie (gimnaziu)", value: "geometrie" },
        // { text: "Algebră (liceu)", value: "algebra" },
        // { text: "Geometrie și Trigonometrie (liceu)", value: "geometrie-trigonometrie" },
        // { text: "Analiză matematică", value: "analiza" }

        // { text: "Aritmetică (primar)", value: "aritmetica" },
        { text: "Algebră", value: "algebra" },
        { text: "Geometrie", value: "geometrie" },
        { text: "Analiză matematică", value: "analiza" }
    ];

    const contestTypeAvailableOptions = [
        { text: "Olimpiadă, etapa locală", value: "olimpiada-locala" },
        { text: "Olimpiadă, etapa județeană", value: "olimpiada-judeteana" },
        { text: "Olimpiadă, etapa națională", value: "olimpiada-nationala" },
        { text: "Evaluare Națională", value: "evaluare-nationala" },
        { text: "Simulare Evaluare Națională", value: "simulare-evaluare-nationala" },
        { text: "Alte concursuri", value: "alte-concursuri" }
    ];

    const sourceTypeAvailableOptions = [
        { text: "Gazeta Matematică (GM)", value: "gazeta-matematica" },
        { text: "Revista de Matematică din Timișoara (RMT)", value: "revista-matematică-tm" },
        { text: "Culegere 'Teme supliment Gazeta Matematică'", value: "teme-supliment-gazeta-matematica" },
        { text: "Culegere 'Mate2000 excelență'", value: "mate2000-excelenta" },
        {
            text: "Culegere 'Matematică pt. olimpiade și concursuri', N. Grigore",
            value: "mate-olimpiade-ngrigore"
        },
        {
            text: "Culegere 'Exerciții pt. cercurile de matematică', P. Năchilă",
            value: "cercuri-mate-pnachila"
        },
        { text: "Culegere 'Mate2000 consolidare'", value: "mate2000-consolidare" },
        { text: "Culegere 'Evaluarea Națională', Ed. Paralela 45", value: "evaluare-nationala-p45" },
        { text: "Alte surse", value: "alte-surse" }
    ];

    const chapterAvailableOptions = [
        { text: "Numere Naturale", value: "numere-naturale" },
        { text: "Numere Raționale", value: "numere-rationale" },
        { text: "Numere Reale", value: "numere-reale" }
    ];

    const subchapterAvailableOptions = [
        { text: "Rapoarte și proporții", value: "rapoarte-si-proportii" }
        // { text: "Numere Raționale", value: "numere-rationale" },
        // { text: "Numere Reale", value: "numere-reale" }
    ];

    const lessonAvailableOptions = [
        { text: "Metoda reducerii numărului de variabile", value: "metoda-reducerii-numarului-de-variabile" }
        // { text: "Numere Raționale", value: "numere-rationale" },
        // { text: "Numere Reale", value: "numere-reale" }
    ];

    const data = {
        isEditMode,
        gradeAvailableOptions,
        branchAvailableOptions,
        contestTypeAvailableOptions,
        sourceTypeAvailableOptions,
        chapterAvailableOptions,
        subchapterAvailableOptions,
        lessonAvailableOptions
    };

    if (isEditMode) {
        const exercise = await exerciseService.getOneById(req.params.id);

        exercise.question.statement.textPreview = markdownService.render(exercise.question.statement.text);
        exercise.question.answer.textPreview = markdownService.render(exercise.question.answer.text);
        exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);

        if (exercise.question.hints) {
            exercise.question.hints.forEach(hint => {
                hint.textPreview = markdownService.render(hint.text);
            });
        }

        if (exercise.question.answerOptions) {
            exercise.question.answerOptions.forEach(answerOption => {
                answerOption.textPreview = markdownService.render(answerOption.text);
            });
        }

        data.exercise = exercise;
    }

    //res.send(data);
    res.render("exercise/exercise-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    try {
        const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
        if (!canCreateOrEditExercise) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const {
            id,
            grade,
            branch,
            contestType,
            contestName,
            sourceType,
            sourceName,
            chapter,
            subchapter,
            lesson,
            author,
            tags,
            obs,
            statement,
            answer,
            solution
        } = req.body;
        const isEditMode = !!id;

        const exercise = {
            question: { statement: { text: statement }, solution: { text: solution }, answer: { text: answer } },
            grade,
            branch,
            contestType,
            contestName,
            sourceType,
            sourceName,
            chapter,
            subchapter,
            lesson,
            author,
            tags,
            obs
        };

        const hints = req.body.hints;
        if (hints) {
            exercise.question.hints = [];
            if (Array.isArray(hints)) {
                hints.forEach(hint => {
                    if (hint.trim()) {
                        exercise.question.hints.push({ text: hint.trim() });
                    }
                });
            } else {
                // an object with a single option
                if (hints.trim()) {
                    exercise.question.hints.push({ text: hints.trim() });
                }
            }
        }

        const answerOptions = req.body.answerOptions;
        if (answerOptions) {
            exercise.question.answerOptions = [];
            if (Array.isArray(answerOptions)) {
                answerOptions.forEach((answerOption, idx) => {
                    if (answerOption.trim()) {
                        const newAnswerOption = { text: answerOption.trim() };

                        // set isCorrectAnswer (if apply)
                        const isCorrectAnswerChecks = req.body.isCorrectAnswerChecks;
                        if (isCorrectAnswerChecks) {
                            if (Array.isArray(isCorrectAnswerChecks)) {
                                if (isCorrectAnswerChecks.includes(String(idx + 1))) {
                                    newAnswerOption.isCorrect = true;
                                }
                            } else {
                                if (isCorrectAnswerChecks === String(idx + 1)) {
                                    newAnswerOption.isCorrect = true;
                                }
                            }
                        }

                        exercise.question.answerOptions.push(newAnswerOption);
                    }
                });
            } else {
                // an object with a single option
                if (answerOptions.trim()) {
                    const newAnswerOption = { text: answerOptions.trim() };

                    // set isCorrectAnswer (if apply)
                    const isCorrectAnswerChecks = req.body.isCorrectAnswerChecks;
                    if (isCorrectAnswerChecks && isCorrectAnswerChecks === "1") {
                        newAnswerOption.isCorrect = true;
                    }
                    exercise.question.answerOptions.push(newAnswerOption);
                }
            }
        }

        if (isEditMode) {
            exercise._id = id;
            exerciseService.updateOne(exercise);
        } else {
            exercise.code = await idGeneratorMongoService.getNextId("exercises");
            const result = await exerciseService.insertOne(exercise);
            exercise._id = result.insertedId;
        }

        //res.send(exercise);
        res.redirect(`/exercitii/edit/${exercise._id}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
    const exercises = await exerciseService.getAll();

    exercises.forEach(exercise => {
        let statement = `**[E.${exercise.code}.](/exercitii/${exercise._id})** ${exercise.question.statement.text}`;

        if (exercise.question.answerOptions) {
            exercise.question.answerOptions.forEach(answerOption => {
                statement = statement + "\n" + "* " + answerOption.text;
            });
        }

        exercise.question.statement.textPreview = markdownService.render(statement);

        if (exercise.question.solution) {
            exercise.question.solution.textPreview = markdownService.render(
                `**Soluție:** ${exercise.question.solution.text}`
            );
        }
        if (exercise.question.hints) {
            exercise.question.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Hint ${idx + 1}:** ${hint.text}`);
            });
        }
    });

    const data = {
        exercises,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise")
    };
    // res.send(data);
    res.render("exercise/exercise-list", data);
};

exports.getOneById = async (req, res) => {
    const exercise = await exerciseService.getOneById(req.params.id);

    if (exercise && exercise.question) {
        if (exercise.question.statement) {
            let statement = `**E.${exercise.code}.** ${exercise.question.statement.text}`;

            if (exercise.question.answerOptions) {
                exercise.question.answerOptions.forEach(answerOption => {
                    statement = statement + "\n" + "* " + answerOption.text;
                });
            }

            exercise.question.statement.textPreview = markdownService.render(statement);
        }

        if (exercise.question.answer)
            exercise.question.answer.textPreview = markdownService.render(exercise.question.answer.text);

        if (exercise.question.solution)
            exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);

        if (exercise.question.hints) {
            exercise.question.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Indicația ${idx + 1}:** ${hint.text}`);
            });
        }
    }

    const data = {
        exercise,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise")
    };
    //res.send(data);
    res.render("exercise/exercise", data);
};

exports.getOneForPrintById = async (req, res) => {
    const exercise = await exerciseService.getOneById(req.params.id);

    if (exercise && exercise.question) {
        if (exercise.question.statement) {
            let statement = `**E.${exercise.code}.** ${exercise.question.statement.text}`;

            if (exercise.question.answerOptions) {
                exercise.question.answerOptions.forEach(answerOption => {
                    statement = statement + "\n" + "* " + answerOption.text;
                });
            }

            exercise.question.statement.textPreview = markdownService.render(statement);
        }
    }

    const data = {
        exercise,
        //layout: false,
        ctx: { hideNavbar: true }
    };
    //res.send(data);
    res.render("exercise/exercise-print", data);
};
