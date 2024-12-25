exports.getAvailableChaptersFromCourse = (course) => {
    return (course.chapters || []).map((chapter) => {
        const newChapter = {
            id: chapter.id,
            name: chapter.name,
        };
        return newChapter;
    });
};
