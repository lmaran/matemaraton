import { fetchHelpers } from "../helpers/fetch.helper.js";

export const courseExerciseService = {
    getAvailableLessons: async (data) => {
        const { courseId } = data;
        return fetchHelpers.get(`/cursuri/${courseId}/available-lessons`);
    },
    getAvailablePositions: async (data) => {
        const { courseId, lessonId, sectionId, levelId, exerciseId } = data;
        return fetchHelpers.get(
            `/cursuri/${courseId}/lectii/${lessonId}/sectiuni/${sectionId}/niveluri/${levelId}/exercise/${exerciseId}/available-positions`
        );
    },
};
