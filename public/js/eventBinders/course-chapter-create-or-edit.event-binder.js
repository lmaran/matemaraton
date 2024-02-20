import { eventHandlers } from "../eventHandlers/course-chapter-create-or-edit.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

document.getElementById("toggle-description-editor-btn")?.addEventListener("click", eventHandlers.toggleDescriptionEditor);
const descriptionEditorTxt = document.getElementById("description-editor-txt");
descriptionEditorTxt?.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getDescriptionPreview, 500)); // with debouncer (500 ms)
