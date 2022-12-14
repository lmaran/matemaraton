import { markdownService } from "../markdown/markdown.service.js";
import { classService } from "./class.service.js";
import { toastService } from "../toast/toast.service.js";

/**
 * DOM elements
 */
const descriptionPreviewDiv = document.getElementById("description-preview-div");

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    getDescriptionPreview: async (event) => {
        const data = { markdown: event.target.value };
        descriptionPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    },

    toggleDescriptionEditor: async (event) => {
        const editorTxt = document.getElementById("description-editor-txt");
        const saveDescriptionDiv = document.getElementById("save-description-div");

        editorTxt.classList.toggle("d-none");
        saveDescriptionDiv.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("description-preview-div");
        previewDiv.classList.toggle("markdown-preview-only");
    },

    saveDescription: async () => {
        const classIdContainer = document.getElementById("class-id-container");
        const descriptionTxt = document.getElementById("description-editor-txt");
        const descriptionPreviewDiv = document.getElementById("description-preview-div");

        const data = {
            classId: classIdContainer.dataset.classId,
            description: descriptionTxt.value,
        };

        const response = await classService.saveDescription(data);

        if (response) {
            if (response.error) {
                toastService.error(response.error.message);
                descriptionTxt.focus();
            } else {
                toastService.success();
                descriptionPreviewDiv.innerHTML = response.descriptionPreview;
            }
        } else {
            toastService.error("Eroare necunoscută!");
        }
    },
};
