import { fetchHelpers } from "../helpers/fetch.helper.js";

export const sectionService = {
    getAvailablePositions: async (data) => {
        const { sectionId, courseId } = data;
        return fetchHelpers.get(`/sectiuni/${sectionId}/available-positions?courseId=${courseId}`);
    },
};
