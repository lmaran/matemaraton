const exerciseService = require("../services/exercise.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
const autz = require("../services/autz.service");
const markdownService = require("../services/markdown.service");
const exerciseHelper = require("../helpers/exercise.helper");
const { availableExerciseTypes } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const exercise = await exerciseService.getOneById(req.params.id);

    if (exercise && exercise.question) {
        if (exercise.question.statement) {
            const statement = `**E.${exercise.code}.** ${exercise.question.statement.text}`;
            // const statement = `**[Problema ${++i}.](/exercitii/${exercise._id})** ${exercise.question.statement.text}`;
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
        }

        if (exercise.question.answer) exercise.question.answer.textPreview = markdownService.render(`**Răspuns:** ${exercise.question.answer.text}`);

        if (exercise.question.solution?.text) exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);

        if (exercise.question.hints) {
            exercise.question.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Indicația ${idx + 1}:** ${hint.text}`);
            });
        }
    }

    const data = {
        exercise,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise"),
        canDeleteExercise: await autz.can(req.user, "delete:exercise"),
    };

    //res.send(data);
    res.render("exercise/exercise", data);
};

exports.createOrEditGet = async (req, res) => {
    const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
    if (!canCreateOrEditExercise) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!req.params.id;

    const data = {
        isEditMode,
        availableExerciseTypes,
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
    } else {
        data.exercise = { exerciseType: "1" }; // Set 'open answer' as a default exercise type
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

        const { id, grade, contestName, exerciseType, sourceName, author, statement, answer, solution } = req.body;
        const isEditMode = !!id;

        const exercise = {
            question: {
                statement: { text: statement },
                solution: { text: solution },
                answer: { text: answer },
            },
            grade,
            exerciseType,
            contestName,
            sourceName,
            author,
        };

        const hints = req.body.hints;
        if (hints) {
            exercise.question.hints = [];
            if (Array.isArray(hints)) {
                hints.forEach((hint) => {
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
        res.redirect(`/exercitii/${exercise._id}/modifica`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
    // const exercises = await exerciseService.getAll();

    const pageSizes = [
        { text: "10 pe pagină", value: "10" },
        { text: "30 pe pagină", value: "30" },
        { text: "50 pe pagină", value: "50" },
    ];

    const currentPage = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (limit > 100) limit = 50;
    const startIndex = (currentPage - 1) * limit;
    let endIndex = currentPage * limit;

    const query = {
        skip: startIndex,
        limit,
    };

    const [exercises, totalExercises] = await Promise.all([await exerciseService.getAll(query), await exerciseService.count()]);

    if (endIndex > totalExercises) endIndex = totalExercises; // fix endIndex for the last page

    exercises.forEach((exercise) => {
        const statement = `**[E.${exercise.code}.](/exercitii/${exercise._id})** ${exercise.question.statement?.text}`;

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
        if (exercise.question.statement) {
            exercise.question.statement.textPreview = markdownService.render(statement);
        }

        if (exercise.question.solution?.text) {
            exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);
        }
        if (exercise.question.hints) {
            exercise.question.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Hint ${idx + 1}:** ${hint.text}`);
            });
        }

        const { authorAndSource1, source2 } = exerciseHelper.getAuthorAndSource(exercise);
        exercise.authorAndSource1 = authorAndSource1;
        exercise.source2 = source2;
    });

    const totalPages = Math.ceil(totalExercises / limit);

    const pageResults = {
        totalExercises,
        pageSizes,
        pageSize: limit,
        startIndex: startIndex + 1,
        endIndex,
        previousPageBtn: {
            page: currentPage - 1,
            isDisabled: currentPage === 1,
        },
        nextPageBtn: {
            page: currentPage + 1,
            isDisabled: currentPage === totalPages,
        },
    };

    const data = {
        exercises,
        canCreateOrEditExercise: await autz.can(req.user, "create-or-edit:exercise"),
        pageResults,
    };
    // res.send(data);
    res.render("exercise/exercise-list", data);
};

exports.deleteOneById = async (req, res) => {
    const exerciseId = req.body.exerciseId;
    const canDeleteExercise = await autz.can(req.user, "delete:exercise");
    if (!canDeleteExercise) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    exerciseService.deleteOneById(exerciseId);

    res.redirect("/exercitii");
};

exports.addMySolution = async (req, res) => {
    // TODO
    // 1. check if authenticcated
    // 2. check if student or teacher
    // 3. check if submission belongs to a homework
    // 4. validate input

    const mySolution = req.body;

    mySolution.submittedById = req.user._id.toString();
    mySolution.submittedOn = new Date();

    //onsole.log(mySolution);

    await exerciseService.insertSolution(mySolution);

    const data = {
        mySolution,
    };
    res.json(data);
    //res.render("exercise/exercise-print", data);
};
