import { eventHandlers } from "../eventHandlers/class.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

document.getElementById("description-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getDescriptionPreview, 500)); // with debouncer (500 ms)

const toggleDescriptionEditorBtn = document.getElementById("toggle-description-editor-btn");
if (toggleDescriptionEditorBtn) toggleDescriptionEditorBtn.addEventListener("click", eventHandlers.toggleDescriptionEditor);

const saveDescriptionDiv = document.getElementById("save-description-div");
if (saveDescriptionDiv) saveDescriptionDiv.addEventListener("click", eventHandlers.saveDescription);
