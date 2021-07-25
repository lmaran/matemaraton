import { fetchHelpers } from "../helpers/fetch.helper.js";

export const classService = {
    // getRenderedMarkdown: async data => {
    //     return fetchHelpers.post("/markdown/get-rendered-markdown", data);
    // },
    // submitMySolution: async (data) => {
    //     return fetchHelpers.post(`/exercitii/${data.exerciseId}/rezolvari`, data);
    // },
    saveDescription: async (data) => {
        return fetchHelpers.put(`/clase/${data.classId}/descriere`, data);
    },
};
