const courseService = require("../services/course.service");
const exerciseService = require("../services/exercise.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");

exports.createOrEditGet = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;
    const exerciseId = req.params.exerciseId;

    // we need sectionId and levelId just for UI (to show the current section/level)
    const sectionId = req.params.sectionId;
    const levelId = req.params.levelId;

    // const activeSection = req.query.section;
    // const activeLevel = req.query.level;

    const isEditMode = !!exerciseId;

    // let lessonRef, courseCode, chapterIndex, positionOptions, selectedPosition;

    try {
        const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
        if (!canCreateOrEditExercise) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const gradeAvailableOptions = [
            { text: "Primar", value: "P" },
            { text: "Clasa a V-a", value: "5" },
            { text: "Clasa a VI-a", value: "6" },
            { text: "Clasa a VII-a", value: "7" },
            { text: "Clasa a VIII-a", value: "8" },
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
            { text: "Analiză matematică", value: "analiza" },
        ];

        const contestTypeAvailableOptions = [
            { text: "Olimpiadă, etapa locală", value: "olimpiada-locala" },
            { text: "Olimpiadă, etapa județeană", value: "olimpiada-judeteana" },
            { text: "Olimpiadă, etapa națională", value: "olimpiada-nationala" },
            { text: "Evaluare Națională", value: "evaluare-nationala" },
            {
                text: "Simulare Evaluare Națională",
                value: "simulare-evaluare-nationala",
            },
            { text: "Alte concursuri", value: "alte-concursuri" },
        ];

        const sourceTypeAvailableOptions = [
            { text: "Gazeta Matematică", value: "gazeta-matematica" },
            {
                text: "Revista de Matematică din Timișoara",
                value: "revista-matematică-tm",
            },
            {
                text: "Culegere 'Teme supliment Gazeta Matematică'",
                value: "teme-supliment-gazeta-matematica",
            },
            { text: "Culegere 'Mate2000 excelență'", value: "mate2000-excelenta" },
            {
                text: "Culegere 'Matematică pt. olimpiade și concursuri', N. Grigore",
                value: "mate-olimpiade-ngrigore",
            },
            {
                text: "Culegere 'Exerciții pt. cercurile de matematică', P. Năchilă",
                value: "cercuri-mate-pnachila",
            },
            {
                text: "Culegere 'Mate2000 consolidare'",
                value: "mate2000-consolidare",
            },
            {
                text: "Culegere 'Evaluarea Națională', Ed. Paralela 45",
                value: "evaluare-nationala-p45",
            },
            { text: "Alte surse", value: "alte-surse" },
        ];

        const chapterAvailableOptions = [
            { text: "Numere Naturale", value: "numere-naturale" },
            { text: "Numere Raționale", value: "numere-rationale" },
            { text: "Numere Reale", value: "numere-reale" },
            { text: "Triunghiuri", value: "triunghiuri" },
            { text: "Patrulatere", value: "patrulatere" },
        ];

        const subchapterAvailableOptions = [
            { text: "Rapoarte și proporții", value: "rapoarte-si-proportii" },
            // { text: "Numere Raționale", value: "numere-rationale" },
            // { text: "Numere Reale", value: "numere-reale" }
            {
                text: "Calculul măsurilor unor unghiuri",
                value: "calculul-masurilor-unor-unghiuri",
            },
        ];

        const lessonAvailableOptions = [
            {
                text: "Metoda reducerii numărului de variabile",
                value: "metoda-reducerii-numarului-de-variabile",
            },
            // { text: "Numere Raționale", value: "numere-rationale" },
            // { text: "Numere Reale", value: "numere-reale" }
            {
                text: "Calculul măsurilor unor unghiuri",
                value: "calculul-masurilor-unor-unghiuri",
            },
        ];

        const data = {
            courseId,
            chapterId,
            lessonId,
            sectionId,
            levelId,
            isEditMode,
            gradeAvailableOptions,
            branchAvailableOptions,
            contestTypeAvailableOptions,
            sourceTypeAvailableOptions,
            chapterAvailableOptions,
            subchapterAvailableOptions,
            lessonAvailableOptions,
        };

        if (isEditMode) {
            const exercise = await exerciseService.getOneById(req.params.id);

            exercise.question.statement.textPreview = markdownService.render(exercise.question.statement.text);
            if (exercise.question.answer && exercise.question.answer.text) {
                exercise.question.answer.textPreview = markdownService.render(exercise.question.answer.text);
            }

            if (exercise.question.solution && exercise.question.solution.text) {
                exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);
            }

            if (exercise.question.hints) {
                exercise.question.hints.forEach((hint) => {
                    hint.textPreview = markdownService.render(hint.text);
                });
            }

            if (exercise.question.answerOptions) {
                exercise.question.answerOptions.forEach((answerOption) => {
                    answerOption.textPreview = markdownService.render(answerOption.text);
                });
            }

            data.exercise = exercise;
        }

        //res.send(data);
        res.render("course-exercise/course-exercise-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};
