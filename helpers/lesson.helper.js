exports.getLessonParentInfo = (course, lessonId) => {
    let chapter;
    let chapterIndex = -1;
    let found = false;
    let lessonIndex = -1;
    let prevLessonId = null;
    let nextLessonId = null;

    const chapters = course.chapters || [];
    for (let i = 0; i < chapters.length; i++) {
        const lessonIds = chapters[i].lessonIds || [];
        const lessonsLength = lessonIds.length;
        for (let j = 0; j < lessonsLength; j++) {
            if (lessonIds[j] == lessonId) {
                found = true;
                lessonIndex = j;

                // TODO when isActive is implemented at the lesson level, prev and next should ignore inactive lessons
                if (j > 0) prevLessonId = lessonIds[j - 1];
                if (j < lessonsLength - 1) nextLessonId = lessonIds[j + 1];
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
        prevLessonId,
        nextLessonId,
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

exports.getAllLessonIdsFromChapter = (chapter) => {
    const lessonIds = [];
    if (chapter.lessonIds) lessonIds.push(...chapter.lessonIds);

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

exports.getAvailableLessonsFromChapter = (chapter, lessonsFromDb) => {
    const availableLessons = [];

    (chapter.lessonIds || []).forEach((lessonId) => {
        const lesson = lessonsFromDb.find((x) => x._id.toString() == lessonId);

        availableLessons.push({
            id: lesson._id.toString(),
            name: lesson.name,
            // exercises: lesson.exercises,
            // isActive: !!(lesson.exercises?.length || lesson.theory?.text),
        });
    });

    return availableLessons;
};
