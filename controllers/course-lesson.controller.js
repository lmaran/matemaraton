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

    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    const isEditMode = !!lessonId;

    const course = await courseService.getOneById(courseId);

    const data = {
        isEditMode,
        positionOptions: [],
    };

    let positionPrefix = "(înainte de)";
    let positionName;
    const chapters = course.chapters || [];
    const selectedChapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (selectedChapterIndex > -1) {
        course.selectedChapter = chapters[selectedChapterIndex];
        course.selectedChapter.index = selectedChapterIndex;

        const lessons = course.selectedChapter.lessons || [];

        if (lessons) {
            const selectedLessonIndex = lessons.findIndex((x) => x.id === lessonId);
            if (selectedLessonIndex > -1) {
                course.selectedLesson = lessons[selectedLessonIndex];
                course.selectedLesson.index = selectedLessonIndex;

                if (course.selectedLesson.articles) {
                    course.selectedLesson.articles.forEach((article) => {
                        if (article.content) {
                            article.content.textPreview = markdownService.render(article.content.text);
                        }
                    });
                }
            }

            lessons.forEach((x, index) => {
                const incIndex = index + 1;
                if (x.id === lessonId) {
                    data.selectedPosition = index; // select the index of the current element
                    positionPrefix = "(după)";
                    positionName = `${incIndex}: "${x.name}"`;
                } else {
                    positionName = `${incIndex}: ${positionPrefix} "${x.name}"`;
                }
                data.positionOptions.push({ index, name: positionName });
            });
        }
    }

    data.course = course;

    //res.send(data);
    res.render("course-lesson/course-lesson-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const isEditMode = !!lessonId;

        const { name, description, isHidden, position } = req.body;

        const lesson = {
            name,
            description,
            isHidden,
        };

        const course = await courseService.getOneById(courseId);
        course.chapters = course.chapters || [];

        const selectedChapterIndex = course.chapters.findIndex((x) => x.id === chapterId);
        if (selectedChapterIndex > -1) {
            course.selectedChapter = course.chapters[selectedChapterIndex];
            course.selectedChapter.index = selectedChapterIndex;

            course.selectedChapter.lessons = course.selectedChapter.lessons || [];

            if (isEditMode) {
                lesson.id = lessonId;
                const lessonIndex = course.selectedChapter.lessons.findIndex((x) => x.id === lessonId);
                if (lessonIndex > -1) {
                    const existingLesson = course.selectedChapter.lessons[lessonIndex];
                    existingLesson.name = lesson.name;
                    existingLesson.description = lesson.description;

                    if (lesson.isHidden === "on") {
                        // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                        existingLesson.isHidden = true;
                    } else {
                        delete existingLesson.isHidden;
                    }

                    // move the lesson from one position (index) to another
                    if (position != lessonIndex && position > -1 && position < course.selectedChapter.lessons.length) {
                        arrayHelper.move(course.selectedChapter.lessons, lessonIndex, position);
                    }
                }
            } else {
                lesson.id = courseService.getObjectId().toString();

                if (lesson.isHidden === "on") {
                    // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                    lesson.isHidden = true;
                }

                if (position > -1 && position < course.selectedChapter.lessons.length) {
                    course.selectedChapter.lessons.splice(position, 0, lesson); // insert at the specified index
                } else {
                    course.selectedChapter.lessons.push(lesson);
                }
            }
        }

        courseService.updateOne(course);

        //res.send(course);
        //res.redirect(`/cursuri/${course._id}/capitole/${course.selectedChapter.id}/lectii/${lesson.id}`);
        res.redirect(`/cursuri/${course._id}/capitole/${course.selectedChapter.id}`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;
    const course = await courseService.getOneById(courseId);

    const chapters = course.chapters || [];
    const courseCode = course.code;
    let lesson, lessonIndex, chapter;

    const chapterIndex = chapters.findIndex((x) => x.id === chapterId);
    if (chapterIndex > -1) {
        chapter = chapters[chapterIndex];

        if (chapter.lessons) {
            lessonIndex = chapter.lessons.findIndex((x) => x.id === lessonId);
            if (lessonIndex > -1) {
                lesson = chapter.lessons[lessonIndex];

                if (lesson.articles) {
                    lesson.articles.forEach((article) => {
                        if (article.content) {
                            article.content.textPreview = markdownService.render(article.content.text);
                        }
                    });
                }

                let allExercisesIds = [],
                    allExercises = [];
                if (lesson.solvedExercises) {
                    const solvedExercisesIds = lesson.solvedExercises.map((x) => x.id);
                    allExercisesIds = allExercisesIds.concat(solvedExercisesIds || []);
                }
                if (lesson.proposedExercises) {
                    const proposedExercisesIds = lesson.proposedExercises.map((x) => x.id);
                    allExercisesIds = allExercisesIds.concat(proposedExercisesIds || []);
                }

                // deduplicate exercisesIds
                const allUniqueExercisesIds = [...new Set(allExercisesIds)];
                if (allUniqueExercisesIds.length > 0) {
                    allExercises = await exerciseService.getAllByIds(allUniqueExercisesIds);
                }

                //  lesson.solvedExercises: [
                //     { id: '5f4636cd17efad83f707e937', level: 1 },
                //     { id: '5f47d415eb57b91c67e5367d', level: 1 },
                //     { id: '5f47dec6eb57b91c67e5367e', level: 2 }]
                if (lesson.solvedExercises) {
                    lesson.solvedExercises = lesson.solvedExercises.map((x, idx) => {
                        const exercise = allExercises.find((y) => y._id.toString() === x.id);
                        // add level property to
                        exercise.level = x.level;
                        // add preview
                        //const statementNumber = `**[R.${++idx}](/exercitii/${exercise._id})**`;
                        const statementNumber = `**R${++idx}.**&nbsp;`;
                        exerciseHelper.addPreview(exercise, statementNumber);
                        return exercise;
                    });
                    lesson.solvedExercises = getExercisesByLevel(lesson.solvedExercises);
                }

                if (lesson.proposedExercises) {
                    lesson.proposedExercises = lesson.proposedExercises.map((x, idx) => {
                        const exercise = allExercises.find((y) => y._id.toString() === x.id);
                        // add level property to
                        exercise.level = x.level;
                        // add preview
                        //const statementNumber = `**[R.${++idx}](/exercitii/${exercise._id})**`;
                        const statementNumber = `**P${++idx}.**&nbsp;`;
                        exerciseHelper.addPreview(exercise, statementNumber);
                        return exercise;
                    });
                    lesson.proposedExercises = getExercisesByLevel(lesson.proposedExercises);
                }
            }
        }
    }

    const data = {
        lesson,
        lessonIndex,
        courseId,
        courseCode,
        chapterId,
        chapterIndex,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };

    //res.send(data);
    res.render("course-lesson/course-lesson", data);
};

exports.deleteOneById = async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const lessonId = req.params.lessonId;

    const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
    if (!canCreateOrEditCourse) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const course = await courseService.getOneById(courseId);
    const chapters = course.chapters || [];

    const selectedChapter = chapters.find((x) => x.id === chapterId);
    const lessons = selectedChapter.lessons || [];

    const lessonIndex = lessons.findIndex((x) => x.id === lessonId);
    if (lessonIndex > -1) {
        //const lesson = lessons[lessonIndex];

        // TODO fix it (delete only empty lessons)
        // if (lesson.lessons && chapter.lessons.length > 0) {
        //     return res.status(403).send("Șterge întâi lecțiile!");
        // }

        lessons.splice(lessonIndex, 1); // remove from array
        courseService.updateOne(course);
    }

    res.redirect(`/cursuri/${courseId}/capitole/${chapterId}`);
};

const getExercisesByLevel = (exercises) => {
    const newExercises = {
        total: 0,
        levels: [
            {
                level: 1,
                levelName: "Nivel introductiv",
                exercises: [],
            },
            {
                level: 2,
                levelName: "Nivel mediu",
                exercises: [],
            },
            {
                level: 3,
                levelName: "Nivel avansat",
                exercises: [],
            },
            {
                level: 0,
                levelName: "Diverse",
                exercises: [],
            },
        ],
    };

    exercises.forEach((x) => {
        const found = newExercises.levels.find((y) => y.level === x.level);
        if (found) found.exercises.push(x);
        newExercises.total++;
    });

    return newExercises;
};
