import { eventHandlers } from "./exercise-create-or-edit.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

/**
 * event binders (alias 'router')
 */

document
    .getElementById("statement-editor-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // with debouncer (500 ms)

document
    .getElementById("answer-editor-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getAnswerPreview, 500)); // with debouncer (500 ms)

document
    .getElementById("solution-editor-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getSolutionPreview, 500)); // with debouncer (500 ms)

document.getElementById("contestTypeSelect").addEventListener("change", eventHandlers.setDefaultContestName);
document.getElementById("sourceTypeSelect").addEventListener("change", eventHandlers.setDefaultSourceName);

document.getElementById("toggle-statement-editor-btn").addEventListener("click", eventHandlers.toggleStatementEditor);
document.getElementById("toggle-answer-editor-btn").addEventListener("click", eventHandlers.toggleAnswerEditor);
document.getElementById("toggle-solution-editor-btn").addEventListener("click", eventHandlers.toggleSolutionEditor);

document.getElementById("add-hint-btn").addEventListener("click", eventHandlers.addHintHtmlNode);
document.getElementById("hint-main-div").addEventListener("click", eventHandlers.handleClickForAllHints);
document
    .getElementById("hint-main-div")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.handleKeyupForAllHints, 500));

document.getElementById("add-answer-option-btn").addEventListener("click", eventHandlers.addAnswerOptionHtmlNode);
document
    .getElementById("answer-option-main-div")
    .addEventListener("click", eventHandlers.handleClickForAllAnswerOptions);
document
    .getElementById("answer-option-main-div")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.handleKeyupForAllAnswerOptions, 500));

// Automatically expand a textarea as the user types (or click)
document.addEventListener("input", eventHandlers.autoExpandAllTextareas);
document.addEventListener("click", eventHandlers.autoExpandAllTextareas);

// const deleteHintButtons = document.getElementsByClassName("delete-hint-btn");
// for (const deleteHintBtn of deleteHintButtons) {
//     deleteHintBtn.addEventListener("click", eventHandlers.deleteHint);
// }
