import { fetchHelpers } from "../helpers/fetch.helper.js";

export const courseService = {
    getAvailableChapters: async (data) => {
        const { courseId } = data;
        return fetchHelpers.get(`/cursuri/${courseId}/available-chapters`);
    },

    getAvailableChapterLessons: async (data) => {
        const { courseId, chapterId, lessonId } = data;
        return fetchHelpers.get(`/cursuri/${courseId}/capitole/${chapterId}/lectii/${lessonId}/available-chapter-lessons`);
    },
};
