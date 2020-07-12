import { eventHandlers } from "./exercise.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { domHelper } from "../helpers/dom.helper.js";

/**
 * event binders (alias 'routes')
 */
const saveBtn = document.getElementById("save-btn");
if (saveBtn) {
    saveBtn.addEventListener("click", eventHandlers.saveExercise);
}

document
    .getElementById("exercise-statement-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getPreview, 500)); // with debouncer (500 ms)

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
