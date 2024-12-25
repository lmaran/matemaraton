import { courseService } from "../services/course.service.js";

export const eventHandlers = {
    onChangeCourse: async (event) => {
        event.preventDefault();

        const courseId = event.target.value;
        const chapterSelect = document.getElementById("chapterSelect");
        const positionSelect = document.getElementById("positionSelect");

        const { availableChapters } = await courseService.getAvailableChapters({ courseId });

        // chapterSelect: remove all options
        while (chapterSelect.options.length) chapterSelect.remove(0);
        // chapterSelect: insert the new options
        chapterSelect.add(new Option("", ""));
        availableChapters.forEach((x) => {
            chapterSelect.add(new Option(x.name, x.id));
        });

        // positionSelect: remove all options
        while (positionSelect.options.length) positionSelect.remove(0);
        // positionSelect: insert an empty line and set it as default
        positionSelect.add(new Option("", ""));
    },

    onChangeChapter: async (event) => {
        event.preventDefault();
        await setDefaultPosition();
    },
};

const setDefaultPosition = async () => {
    const courseId = document.getElementById("courseSelect").value;
    const lessonId = document.getElementById("lessonId").value;
    const chapterId = document.getElementById("chapterSelect").value;
    const positionSelect = document.getElementById("positionSelect");

    if (lessonId == "") return;

    const { availablePositions } = await courseService.getAvailableChapterLessons({ courseId, chapterId, lessonId });

    // positionSelect: remove all options
    while (positionSelect.options.length) positionSelect.remove(0);

    // positionSelect: insert the new options
    availablePositions.forEach((x) => {
        positionSelect.add(new Option(x.name, x.index));
    });

    // set the last position as default
    positionSelect.value = availablePositions[availablePositions.length - 1].index;
};
