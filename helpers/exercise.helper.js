const markdownService = require("../services/markdown.service");

exports.addPreview = (exercise, statementNumber) => {
    if (exercise && exercise.question) {
        if (exercise.question.statement) {
            // Insert a label (e.g. "E.1") in front of each statement.
            exercise.question.statement.textPreview = markdownService.render(`${statementNumber} ${exercise.question.statement.text}`);
        }

        // Insert a label (e.g. "a", "b"...) in front of each option.
        if (exercise.question.answerOptions) {
            const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
            exercise.question.answerOptions.forEach((answerOption, idx) => {
                answerOption.textPreview = markdownService.render(`${alphabet[idx]}) ${answerOption.text}`);
                if (answerOption.isCorrect) {
                    exercise.question.correctAnswerPreview = markdownService.render(`**Răspuns:** ${answerOption.text}`);
                }
            });
        }

        if (exercise.question.answer) exercise.question.answer.textPreview = markdownService.render(`**Răspuns:** ${exercise.question.answer.text}`);

        if (exercise.question.solution) exercise.question.solution.textPreview = markdownService.render(exercise.question.solution.text);

        if (exercise.question.hints) {
            exercise.question.hints.forEach((hint, idx) => {
                hint.textPreview = markdownService.render(`**Indicația ${idx + 1}:** ${hint.text}`);
            });
        }
    }
    //return exercise;
};
