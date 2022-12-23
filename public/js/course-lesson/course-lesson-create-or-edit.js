import { commonEventHandler } from "./course-lesson.common-event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { markdownService } from "../markdown/markdown.service.js";

/**
 * event handlers (alias 'controller')
 */

const eventHandlers = {
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

/**
 * event binders (alias 'router')
 */

document.getElementById("toggle-theory-editor-btn").addEventListener("click", eventHandlers.toggleTheoryEditor);
document.getElementById("theory-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getTheoryPreview, 500)); // with debouncer (500 ms)

// common
document.querySelectorAll(".toggle-level-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleLevel));
document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleHints));
document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", commonEventHandler.showNextHint));
document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSolution));
