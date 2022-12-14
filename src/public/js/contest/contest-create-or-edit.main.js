import { eventHandlers } from "./contest-create-or-edit.event-handler.js";

document.getElementById("contestTypeSelect").addEventListener("change", eventHandlers.setDefaultContestName);
