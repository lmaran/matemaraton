import { eventHandlers } from "../eventHandlers/course-create-or-edit.event-handler.js";

document.getElementById("sectionSelect").addEventListener("change", eventHandlers.setDefaultSection);
