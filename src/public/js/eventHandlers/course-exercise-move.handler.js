//import { commonEventHandler } from "./course-lesson.common-event-handler.js";
// import { dateTimeHelper } from "../helpers/date-time.helper.js";
// import { markdownService } from "../markdown/markdown.service.js";

import { courseExerciseService } from "../services/course-exercise.service.js";

export const eventHandlers = {
    setDefaultCourse: async (event) => {
        event.preventDefault();

        const courseId = event.target.value;
        const lessonSelect = document.getElementById("lessonSelect");
        const positionSelect = document.getElementById("positionSelect");

        const { availableLessons } = await courseExerciseService.getAvailableLessons({ courseId });

        // lessonSelect: remove all options
        while (lessonSelect.options.length) lessonSelect.remove(0);
        // lessonSelect: insert the new options
        lessonSelect.add(new Option("", ""));
        availableLessons.forEach((x) => {
            lessonSelect.add(new Option(x.name, x.id));
        });

        // positionSelect: remove all options
        while (positionSelect.options.length) positionSelect.remove(0);
        // positionSelect: insert an empty line and set it as default
        positionSelect.add(new Option("", ""));
    },

    setDefaultLesson: async (event) => {
        event.preventDefault();
        await setDefaultPosition();
    },

    setDefaultSection: async (event) => {
        event.preventDefault();
        await setDefaultPosition();
    },

    setDefaultLevel: async (event) => {
        event.preventDefault();
        await setDefaultPosition();
    },
};

const setDefaultPosition = async () => {
    const courseId = document.getElementById("courseSelect").value;
    const lessonId = document.getElementById("lessonSelect").value;
    const sectionId = document.getElementById("sectionSelect").value;
    const levelId = document.getElementById("levelSelect").value;
    const positionSelect = document.getElementById("positionSelect");
    const exerciseId = document.getElementById("exerciseId").value;

    if (lessonId == "") return;

    const { availablePositions } = await courseExerciseService.getAvailablePositions({ courseId, lessonId, sectionId, levelId, exerciseId });

    // positionSelect: remove all options
    while (positionSelect.options.length) positionSelect.remove(0);

    // positionSelect: insert the new options
    availablePositions.forEach((x) => {
        positionSelect.add(new Option(x.name, x.index));
    });

    // set the last position as default
    positionSelect.value = availablePositions[availablePositions.length - 1].index;
};
