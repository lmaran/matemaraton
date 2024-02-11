const lessonService = require("../services/lesson.service");

exports.getLessonParentInfo = (course, lessonId) => {
    let chapter;
    let chapterIndex = -1;
    let found = false;
    let lessonIndex = -1;

    const chapters = course.chapters || [];
    for (let i = 0; i < chapters.length; i++) {
        const lessonIds = chapters[i].lessonIds || [];
        for (let j = 0; j < lessonIds.length; j++) {
            if (lessonIds[j] == lessonId) {
                found = true;
                lessonIndex = j;
                break;
            }
        }

        if (found) {
            chapter = chapters[i];
            chapterIndex = i;
            break;
        }
    }

    return {
        chapter,
        chapterIndex,
        lessonIndex,
    };
};

exports.getAllLessonIdsFromCourse = (course) => {
    const lessonIds = [];
    if (course && course.chapters) {
        course.chapters.forEach((chapter) => {
            if (chapter.lessonIds) lessonIds.push(...chapter.lessonIds);
        });
    }
    return lessonIds;
};

exports.getAvailableLessons = (course, lessonsFromDb) => {
    const availableLessons = [];
    (course.chapters || []).forEach((chapter) => {
        (chapter.lessonIds || []).forEach((lessonId) => {
            const lesson = lessonsFromDb.find((x) => x._id.toString() == lessonId);

            availableLessons.push({
                id: lesson._id.toString(),
                name: lesson.name,
                // exercises: lesson.exercises,
                // isActive: !!(lesson.exercises?.length || lesson.theory?.text),
            });
        });
    });

    return availableLessons;
};
