const markdownService = require("../services/markdown.service");
const lessonHelper = require("../helpers/lesson.helper");

exports.addPreview = (exercise, statementNumber, clear) => {
    if (exercise) {
        if (exercise.statement) {
            // Insert a label (e.g. "E.1") in front of each statement.
            exercise.statementPreview = markdownService.render(`${statementNumber} ${exercise.statement}`);
            if (clear) delete exercise.statement;
        }

        // Insert a label (e.g. "a", "b"...) in front of each option. ExerciseType=2 => grilă.
        if (exercise.exerciseType == "2") {
            if (exercise.answerOptions) {
                const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
                exercise.answerOptions.forEach((answerOption, idx) => {
                    answerOption.textPreview = markdownService.render(`${alphabet[idx]}) ${answerOption.text}`);
                    if (answerOption.isCorrect) {
                        exercise.answerPreview = markdownService.render(`**Răspuns:** ${alphabet[idx]}) ${answerOption.text}`);
                        if (clear) delete answerOption.text;
                    }
                });
            }
        } else {
            if (exercise.answer) {
                exercise.answerPreview = markdownService.render(`**Răspuns:** ${exercise.answer}`);
                if (clear) delete exercise.answer;
            }
        }

        if (exercise.solution) {
            exercise.solutionPreview = markdownService.render(exercise.solution);
            if (clear) delete exercise.solution;
        }

        if (exercise.hints) {
            exercise.hints.forEach((hint, idx) => {
                let hintPrefix = `**Indicația ${idx + 1}:**`;

                if (exercise.hints.length == 1) {
                    hintPrefix = `**Indicații:**`;
                }

                hint.textPreview = markdownService.render(`${hintPrefix} ${hint.text}`);
                if (clear) delete hint.text;
            });
        }
    }
};

exports.getAuthorAndSource = (exercise) => {
    // row1 = authorAndSource1 = "<Author>, <ContestName>"
    // row2 = source2 = "<SourceName>"
    // If <ContestName> is not present, we will put "<SourceName>" on row1

    let authorAndSource1, source2;

    if (exercise.author) {
        authorAndSource1 = exercise.author;
        if (exercise.contestName) {
            authorAndSource1 = `${authorAndSource1}, ${exercise.contestName}`;
            source2 = exercise.sourceName;
        } else if (exercise.sourceName) {
            authorAndSource1 = `${authorAndSource1}, ${exercise.sourceName}`;
        }
    } else if (exercise.contestName) {
        authorAndSource1 = exercise.contestName;
        source2 = exercise.sourceName;
    } else {
        authorAndSource1 = exercise.sourceName;
    }
    return {
        authorAndSource1,
        source2,
    };
};

exports.getExerciseParentInfo = (course, lesson, lessonId, exerciseId) => {
    let exerciseIndex = -1,
        levelId = null;

    const { chapter, chapterIndex, lessonIndex } = lessonHelper.getLessonParentInfo(course, lessonId);

    const exercises = lesson.exercises || [];
    for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].id == exerciseId) {
            levelId = exercises[i].levelId;
            exerciseIndex = i;
            break;
        }
    }

    return {
        chapter,
        chapterIndex,
        lessonIndex,
        levelId,
        exerciseIndex,
    };
};
