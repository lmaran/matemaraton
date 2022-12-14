import { markdownService } from "../markdown/markdown.service.js";
//import { domHelper } from "../helpers/dom.helper.js";

/**
 * DOM elements
 */
const contentPreviewDiv = document.getElementById("content-preview-div");

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    getContentPreview: async (event) => {
        const data = { markdown: event.target.value };
        contentPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    },

    toggleContentEditor: async (event) => {
        const editorTxt = document.getElementById("content-editor-txt");
        editorTxt.classList.toggle("hide-content-editor");

        const editorIsHide = editorTxt.classList.contains("hide-content-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("content-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
};
