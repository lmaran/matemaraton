import { markdownService } from "../markdown/markdown.service.js";
import { classService } from "./class.service.js";
import { domHelper } from "../helpers/dom.helper.js";

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
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },

    saveDescription: async () => {
        // const editorTxt = document.getElementById("description-editor-txt");
        // const saveDescriptionDiv = document.getElementById("save-description-div");
        // editorTxt.classList.toggle("d-none");
        // saveDescriptionDiv.classList.toggle("d-none");
        // const editorIsHide = editorTxt.classList.contains("d-none");
        // event.target.textContent = editorIsHide ? "Editează" : "Ascunde";
        // const previewDiv = document.getElementById("description-preview-div");
        // previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";

        const classIdContainer = document.getElementById("class-id-container");
        const descriptionTxt = document.getElementById("description-editor-txt");
        const descriptionPreviewDiv = document.getElementById("description-preview-div");
        //const saveDescriptionIcon = document.getElementById("save-description-icon");

        const data = {
            classId: classIdContainer.dataset.classId,
            description: descriptionTxt.value,
        };

        const newclass = await classService.saveDescription(data);
        descriptionPreviewDiv.innerHTML = newclass.descriptionPreview;

        // show and fadeOut status icon
        //domHelper.showAndFadeOut(saveDescriptionIcon, 500);
        domHelper.applyColorGreenTransition(descriptionPreviewDiv, 2000);
    },
};
