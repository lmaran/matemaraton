import { eventHandlers } from "./exercise.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { domHelper } from "../helpers/dom.helper.js";

/**
 * event binders (alias 'routes')
 */
// const saveBtn = document.getElementById("save-btn");
// if (saveBtn) {
//     saveBtn.addEventListener("click", eventHandlers.saveExercise);
// }

document
    .getElementById("statement-editor-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // with debouncer (500 ms)

document
    .getElementById("solution-editor-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getSolutionPreview, 500)); // with debouncer (500 ms)

document.getElementById("contestTypeSelect").addEventListener("change", eventHandlers.setDefaultContestName);
document.getElementById("sourceTypeSelect").addEventListener("change", eventHandlers.setDefaultSourceName);

document.getElementById("toggle-statement-editor-btn").addEventListener("click", eventHandlers.toggleStatementEditor);
document.getElementById("toggle-solution-editor-btn").addEventListener("click", eventHandlers.toggleSolutionEditor);

// const hintTxtElements = document.getElementsByClassName("hint-editor-txt");
// for (const hintTxt of hintTxtElements) {
//     hintTxt.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getHintPreview, 500));
// }

// const toggleHintButtons = document.getElementsByClassName("toggle-hint-editor-btn");
// for (const toggleHintBtn of toggleHintButtons) {
//     toggleHintBtn.addEventListener("click", eventHandlers.toggleHintEditor);
// }

// const deleteHintButtons = document.getElementsByClassName("delete-hint-btn");
// for (const deleteHintBtn of deleteHintButtons) {
//     deleteHintBtn.addEventListener("click", eventHandlers.deleteHint);
// }

document.getElementById("hint-main-div").addEventListener("click", eventHandlers.handleClickForAllHints);
document
    .getElementById("hint-main-div")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.handleKeyupForAllHints, 500));

document.getElementById("add-hint-btn").addEventListener("click", eventHandlers.addHintHtmlNode);

/**
 * Automatically expand a textarea as the user types
 * https://gomakethings.com/automatically-expand-a-textarea-as-the-user-types-using-vanilla-javascript/
 */
document.addEventListener(
    "input",
    function(event) {
        if (event.target.tagName.toLowerCase() !== "textarea") return;
        domHelper.autoExpand(event.target);
    },
    false
);
