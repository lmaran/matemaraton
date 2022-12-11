import { fetchHelpers } from "../helpers/fetch.helper.js";

export const exerciseService = {
    // getRenderedMarkdown: async data => {
    //     return fetchHelpers.post("/markdown/get-rendered-markdown", data);
    // },
    submitMySolution: async (data) => {
        return fetchHelpers.post(
            `/exercitii/${data.exerciseId}/rezolvari`,
            data
        );
    },
    // saveExercise: async data => {
    //     return fetchHelpers.put(`/exercitii/statement/${data.exerciseId}`, data);
    // }
};
