import { fetchHelpers } from "../helpers/fetch.helper.js";

export const markdownService = {
    getRenderedMarkdown: async (data) => {
        return fetchHelpers.post("/markdown/get-rendered-markdown", data);
    },
    // saveExercise: async data => {
    //     return fetchHelpers.put(`/exercitii/statement/${data.exerciseId}`, data);
    // }
};
