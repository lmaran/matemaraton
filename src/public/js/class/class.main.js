import { eventHandlers } from "./class.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

/**
 * event binders (alias 'router')
 */

document.getElementById("description-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getDescriptionPreview, 500)); // with debouncer (500 ms)

document.getElementById("toggle-description-editor-btn").addEventListener("click", eventHandlers.toggleDescriptionEditor);
document.getElementById("save-description-div").addEventListener("click", eventHandlers.saveDescription);
