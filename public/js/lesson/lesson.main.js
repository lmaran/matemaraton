import { eventHandlers } from "./lesson.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

/**
 * event binders (alias 'router')
 */

document
    .getElementById("content-editor-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getContentPreview, 500)); // with debouncer (500 ms)

document.getElementById("toggle-content-editor-btn").addEventListener("click", eventHandlers.toggleContentEditor);

// Automatically expand a textarea as the user types (or click)
document.addEventListener("input", eventHandlers.autoExpandAllTextareas);
document.addEventListener("click", eventHandlers.autoExpandAllTextareas);
