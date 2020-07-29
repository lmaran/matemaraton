const exerciseService = require("../services/exercise.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const autz = require("../services/autz.service");

const katex = require("katex");

const tm = require("markdown-it-texmath").use(katex);
const md = require("markdown-it")().use(tm, { delimiters: "dollars", macros: { "\\RR": "\\mathbb{R}" } });

exports.deleteExercise = async (req, res) => {
    const canDeleteExercise = await autz.can(req.user, "delete:exercise");
    if (!canDeleteExercise) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    exerciseService.deleteOneByCode(req.body.code);
    res.redirect("/exercitii");
};

exports.createOrEditExerciseGet = async (req, res) => {
    const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
    if (!canCreateOrEditExercise) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!req.params.code;

    // const availableGrades = ["P", "5", "6", "7", "8", "9", "10", "11", "12"];
    const gradeAvailableOptions = [
        { text: "Primar", value: "P" },
        { text: "Clasa a V-a", value: "5" },
        { text: "Clasa a VI-a", value: "6" }
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
        { text: "Numere Raționale", value: "numere-rationale" },
        { text: "Numere Reale", value: "numere-reale" }
    ];

    const data = {
        isEditMode,
        gradeAvailableOptions,
        branchAvailableOptions,
        contestTypeAvailableOptions,
        sourceTypeAvailableOptions,
        chapterAvailableOptions
    };

    if (isEditMode) {
        const exercise = await exerciseService.getByCode(req.params.code);

        exercise.question.statement.textPreview = md.render(exercise.question.statement.text);
        exercise.question.solution.textPreview = md.render(exercise.question.solution.text);
        data.exercise = exercise;
    }

    res.render("exercise/exercise-create-or-edit", data);
};

exports.createOrEditExercisePost = async (req, res) => {
    try {
        const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
        if (!canCreateOrEditExercise) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const {
            code,
            grade,
            branch,
            contestType,
            contestName,
            sourceType,
            sourceName,
            chapter,
            author,
            tags,
            obs
        } = req.body;
        const isEditMode = !!code;

        const exercise = {
            code,
            question: { statement: {}, solution: {} },
            // source,
            grade,
            branch,
            contestType,
            contestName,
            sourceType,
            sourceName,
            chapter,
            author,
            tags,
            obs
        };
        exercise.question.statement.text = req.body.statement;
        exercise.question.solution.text = req.body.solution;

        if (isEditMode) {
            exerciseService.updateOneByCode(exercise);
        } else {
            exercise.code = await idGeneratorMongoService.getNextId("exercises");
            exerciseService.insertOne(exercise);
        }

        //res.send(exercise);
        res.redirect(`/exercitii/edit/${exercise.code}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getExercises = async (req, res) => {
    const exercises = await exerciseService.getAll();

    exercises.forEach(exercise => {
        exercise.question.statement.textPreview = md.render(
            `**[E.${exercise.code}.](/exercitii/${exercise.code})** ${exercise.question.statement.text}`
        );
    });

    const data = {
        exercises,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise")
    };
    //res.send(data);
    res.render("exercise/exercises", data);
};

exports.getExerciseByCode = async (req, res) => {
    const exercise = await exerciseService.getByCode(req.params.code);

    // problem.question.statement.text = md.render(problem.question.statement.text);

    const q5 = `Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\medspace x$ divizor al lui 10 $\\}.$\\
    a) Scrieți elementele mulțimilor $A$ si $B$.
    `;

    exercise.question.statement.textPreview = md.render(exercise.question.statement.text);
    exercise.question.solution.textPreview = md.render(exercise.question.solution.text);

    // const data = { problem, testOriginal: q5, test: md.render(q5) };
    const data = {
        exercise,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise")
    };
    //res.send(data);
    res.render("exercise/exercise", data);
};

// exports.editExerciseByCode = async (req, res) => {
//     const exercise = await exerciseService.getByCode(req.params.code);

//     exercise.question.statement.textPreview = md.render(exercise.question.statement.text);

//     // const data = { problem, testOriginal: q5, test: md.render(q5) };
//     const data = { exercise };
//     //res.send(data);
//     res.render("exercise/exercise-edit", data);
// };

exports.createKatexPreview = async (req, res) => {
    const katex = req.body.katex;
    const html = md.render(katex);
    res.status(201).json(html);
};

exports.updateStatement = async (req, res) => {
    const exerciseId = req.params.id;
    const exerciseStatement = req.body.exerciseStatement;

    const exercise = await exerciseService.getById(exerciseId);

    exercise.question.statement.text = exerciseStatement;

    exerciseService.updateOne(exercise); // don't have to await

    // update preview field also
    exercise.question.statement.textPreview = md.render(exercise.question.statement.text);
    res.status(200).json(exercise); // or res.status(204).send();  fo No Content
};
