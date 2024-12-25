import { eventHandlers } from "../eventHandlers/lesson-move.event-handler.js";

document.getElementById("courseSelect").addEventListener("change", eventHandlers.onChangeCourse);
document.getElementById("chapterSelect").addEventListener("change", eventHandlers.onChangeChapter);
