import { eventHandlers } from "../eventHandlers/course-exercise-move.handler.js";

document.getElementById("courseSelect").addEventListener("change", eventHandlers.setDefaultCourse);
document.getElementById("lessonSelect").addEventListener("change", eventHandlers.setDefaultLesson);
document.getElementById("sectionSelect").addEventListener("change", eventHandlers.setDefaultSection);
document.getElementById("levelSelect").addEventListener("change", eventHandlers.setDefaultLevel);
