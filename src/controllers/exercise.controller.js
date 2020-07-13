const exerciseService = require("../services/exercise.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");

const katex = require("katex");

const tm = require("markdown-it-texmath").use(katex);
const md = require("markdown-it")().use(tm, { delimiters: "dollars", macros: { "\\RR": "\\mathbb{R}" } });

exports.deleteExercise = async (req, res) => {
    exerciseService.deleteOneByCode(req.body.code);
    res.redirect("/exercitii");
};

exports.createOrEditExerciseGet = async (req, res) => {
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

    const data = {
        isEditMode,
        gradeAvailableOptions,
        branchAvailableOptions,
        contestTypeAvailableOptions,
        sourceTypeAvailableOptions
    };

    if (isEditMode) {
        const exercise = await exerciseService.getByCode(req.params.code);

        exercise.question.statement.textPreview = md.render(exercise.question.statement.text);
        data.exercise = exercise;
    }

    res.render("exercise/exercise-create-or-edit", data);
};

exports.createOrEditExercisePost = async (req, res) => {
    try {
        //const isEditMode = !!req.params.code;
        //const isCreateMode = !isEditMode;

        const { code, grade, branch, contestType, contestName, sourceType, sourceName } = req.body;
        const isEditMode = !!code;

        const exercise = {
            code,
            question: { statement: {} },
            // source,
            grade,
            branch,
            contestType,
            contestName,
            sourceType,
            sourceName
        };
        exercise.question.statement.text = req.body.statement;

        if (isEditMode) {
            exerciseService.updateOneByCode(exercise);
        } else {
            exercise.code = await idGeneratorMongoService.getNextId("exercises");
            exerciseService.insertOne(exercise);
        }

        //res.send(exercise);
        res.redirect(`/exercitii/edit/${exercise.code}`);

        // // handle static validation errors
        // const validationErrors = getSignupStaticValidationErrors(firstName, lastName, email, password, confirmPassword);
        // if (validationErrors.length) {
        //     return flashAndReloadSignupPage(req, res, validationErrors);
        // }

        // if (invitationCode) {
        //     const { token, refreshToken } = await authService.signupByInvitationCode(
        //         firstName,
        //         lastName,
        //         // email,
        //         password,
        //         invitationCode
        //     );

        //     cookieHelper.setCookies(res, token, refreshToken);

        //     res.redirect("/signup/confirm-invitation-done");
        // } else {
        //     const activationCode = await authService.signupByUserRegistration(firstName, lastName, email, password);
        //     // Send this code on email
        //     const rootUrl = config.externalUrl; // e.g. http://localhost:1417
        //     const link = `${rootUrl}/signup/confirm/${activationCode}`;

        //     const data = {
        //         to: email,
        //         subject: "Activare cont",
        //         html: `<html>Pentru activarea contului te rugăm să accesezi
        //     <a href="${link}">link-ul de activare</a>!
        //     </html>`
        //     };

        //     await emailService.sendEmail(data);

        //     res.redirect("/signup/ask-to-confirm");
        // }
    } catch (err) {
        // // handle dynamic validation errors
        // const validationErrors = [];
        // if (err.message === "EmailAlreadyExists") {
        //     validationErrors.push({ field: "email", msg: "Există deja un cont cu acest email" });
        // }

        // if (validationErrors.length) {
        //     return flashAndReloadSignupPage(req, res, validationErrors);
        // }

        // @TODO display an error message (without details) and log the details
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

    const data = { exercises };
    //res.send(data);
    res.render("exercise/exercises", data);
};

exports.getExerciseByCode = async (req, res) => {
    // console.log(req.params.code);
    const exercise = await exerciseService.getByCode(req.params.code);

    // problem.question.statement.text = md.render(problem.question.statement.text);

    const q5 = `Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\medspace x$ divizor al lui 10 $\\}.$\\
    a) Scrieți elementele mulțimilor $A$ si $B$.
    `;

    exercise.question.statement.textPreview = md.render(exercise.question.statement.text);

    // const data = { problem, testOriginal: q5, test: md.render(q5) };
    const data = { exercise };
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

exports.createKatekPreview = async (req, res) => {
    const exerciseStatementKatex = req.body.exerciseStatement;
    const exerciseStatementHtml = md.render(exerciseStatementKatex);
    res.status(201).json(exerciseStatementHtml);
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