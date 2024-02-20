import { markdownService } from "../services/markdown.service.js";

const editorTxt = document.getElementById("description-editor-txt");
const descriptionPreviewDiv = document.getElementById("description-preview-div");

export const eventHandlers = {
    toggleDescriptionEditor: async (event) => {
        event.preventDefault();

        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";
        descriptionPreviewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    getDescriptionPreview: async (event) => {
        const data = { markdown: event.target.value };
        descriptionPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    },
};
