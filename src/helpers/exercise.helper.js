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

exports.getExerciseAndParentsFromCourse = (course, exerciseId) => {
    let chapter;
    let chapterIndex = -1;
    let lesson;
    let lessonIndex = -1;
    let exercise;
    let exerciseIndex = -1;

    const chapters = course.chapters || [];
    for (let i = 0; i < chapters.length; i++) {
        const lessons = chapters[i].lessons || [];
        for (let j = 0; j < lessons.length; j++) {
            const exercises = lessons[j].exercises || [];
            for (let k = 0; k < exercises.length; k++) {
                if (exercises[k].id == exerciseId) {
                    exercise = exercises[k];
                    exerciseIndex = k;
                    break;
                }
            }

            if (exercise) {
                lesson = lessons[j];
                lessonIndex = j;
                break;
            }
        }

        if (lesson) {
            chapter = chapters[i];
            chapterIndex = i;
            break;
        }
    }

    return {
        chapter,
        chapterIndex,
        lesson,
        lessonIndex,
        exerciseMeta: exercise,
        exerciseIndex,
    };
};
