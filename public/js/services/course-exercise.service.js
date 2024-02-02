import { fetchHelpers } from "../helpers/fetch.helper.js";

export const courseExerciseService = {
    getAvailableLessons: async (data) => {
        const { courseId } = data;
        return fetchHelpers.get(`/cursuri/${courseId}/available-lessons`);
    },
    getAvailablePositions: async (data) => {
        const { courseId, lessonId, levelId, exerciseId } = data;
        return fetchHelpers.get(`/cursuri/${courseId}/lectii/${lessonId}/niveluri/${levelId}/exercise/${exerciseId}/available-positions`);
    },
};
