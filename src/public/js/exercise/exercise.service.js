import { fetchHelpers } from "../helpers/fetch.helper.js";

export const exerciseService = {
    getKatexPreview: async data => {
        return fetchHelpers.post("/katex/get-preview", data);
    },
    saveExercise: async data => {
        return fetchHelpers.put(`/exercitii/statement/${data.exerciseId}`, data);
    }
};
