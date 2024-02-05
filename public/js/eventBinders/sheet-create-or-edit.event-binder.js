import { eventHandlers } from "../eventHandlers/sheet-create-or-edit.event-handler.js";
import { commonEventHandler } from "../eventHandlers/course-lesson.common-event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

// document.getElementById("toggle-theory-editor-btn").addEventListener("click", eventHandlers.toggleTheoryEditor);
// document.getElementById("theory-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getTheoryPreview, 500)); // with debouncer (500 ms)

// common
document.querySelectorAll(".toggle-answer-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleAnswer));
document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleHints));
document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", commonEventHandler.showNextHint));
document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSolution));

// fires on page load
document.addEventListener("DOMContentLoaded", eventHandlers.onDOMContentLoaded);

document.getElementById("title-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getTitlePreview, 500)); // with debouncer (500 ms)
