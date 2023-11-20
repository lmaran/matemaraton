exports.getLessonAndParentsFromCourse = (course, lessonId) => {
    let chapter;
    let chapterIndex = -1;
    let lesson;
    let lessonIndex = -1;

    const chapters = course.chapters || [];
    for (let i = 0; i < chapters.length; i++) {
        const lessons = chapters[i].lessons || [];

        for (let j = 0; j < lessons.length; j++) {
            if (lessons[j].id == lessonId) {
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
    };
};
