import { eventHandlers } from "../eventHandlers/exercise-move.event-handler.js";

document.getElementById("courseSelect").addEventListener("change", eventHandlers.setDefaultCourse);
document.getElementById("lessonSelect").addEventListener("change", eventHandlers.setDefaultLesson);
document.getElementById("levelSelect").addEventListener("change", eventHandlers.setDefaultLevel);
