const markdownService = require("../services/markdown.service");

exports.addPreview = (exercise, statementNumber, clear) => {
    if (exercise) {
        if (exercise.statement) {
            // Insert a label (e.g. "E.1") in front of each statement.
            exercise.statementPreview = markdownService.render(`${statementNumber} ${exercise.statement}`);
            if (clear) delete exercise.statement;
        }

        // Insert a label (e.g. "a", "b"...) in front of each option.
        if (exercise.answerOptions) {
            const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
            exercise.answerOptions.forEach((answerOption, idx) => {
                answerOption.textPreview = markdownService.render(`${alphabet[idx]}) ${answerOption.text}`);
                if (answerOption.isCorrect) {
                    exercise.correctAnswerPreview = markdownService.render(`**Răspuns:** ${answerOption.text}`);
                    if (clear) delete answerOption.text;
                }
            });
        }

        if (exercise.answer) {
            exercise.answerPreview = markdownService.render(`**Răspuns:** ${exercise.answer}`);
            if (clear) delete exercise.answer;
        }

        if (exercise.solution) {
            exercise.solutionPreview = markdownService.render(exercise.solution);
            if (clear) delete exercise.solution;
        }

        if (exercise.hints) {
            exercise.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Indicația ${idx + 1}:** ${hint.text}`);
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