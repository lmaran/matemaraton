import { eventHandlers } from "./exercise.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

/**
 * event binders (alias 'routes')
 */
document.getElementById("save-btn").addEventListener("click", eventHandlers.saveExercise);
document
    .getElementById("exercise-statement-txt")
    .addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getPreview, 500)); // with debouncer (500 ms)
