import { eventHandlers } from "../eventHandlers/lesson.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";

document.getElementById("content-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getContentPreview, 500)); // with debouncer (500 ms)

document.getElementById("toggle-content-editor-btn").addEventListener("click", eventHandlers.toggleContentEditor);
