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

const hintTxtElements = document.getElementsByClassName("hint-txt");
for (const hintTxt of hintTxtElements) {
    hintTxt.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getHintPreview, 500));
}

document.getElementById("contestTypeSelect").addEventListener("change", eventHandlers.setDefaultContestName);
document.getElementById("sourceTypeSelect").addEventListener("change", eventHandlers.setDefaultSourceName);

document.getElementById("toggle-statement-editor-btn").addEventListener("click", eventHandlers.toggleStatementEditor);
document.getElementById("toggle-solution-editor-btn").addEventListener("click", eventHandlers.toggleSolutionEditor);

const toggleHintBtnElements = document.getElementsByClassName("toggle-hint-editor-btn");
for (const toggleHintBtnElement of toggleHintBtnElements) {
    toggleHintBtnElement.addEventListener("click", eventHandlers.toggleHintEditor);
}

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
