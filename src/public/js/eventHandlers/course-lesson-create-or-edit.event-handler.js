import { markdownService } from "../services/markdown.service.js";

export const eventHandlers = {
    toggleTheoryEditor: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        const editorTxt = document.getElementById("theory-editor-txt");
        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("theory-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    getTheoryPreview: async (event) => {
        const data = { markdown: event.target.value };
        const theoryPreviewDiv = document.getElementById("theory-preview-div");
        theoryPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    },
};
