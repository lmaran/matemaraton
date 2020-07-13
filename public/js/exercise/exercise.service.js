import { fetchHelpers } from "../helpers/fetch.helper.js";

export const exerciseService = {
    getKatexPreview: async data => {
        return fetchHelpers.post("/exercitii/katex-preview", data);
    },
    saveExercise: async data => {
        return fetchHelpers.put(`/exercitii/statement/${data.exerciseId}`, data);
    }
};
