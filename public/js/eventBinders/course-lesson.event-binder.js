import { commonEventHandler } from "../eventHandlers/course-lesson.common-event-handler.js";

document.querySelectorAll(".toggle-level-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleLevel));
document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleHints));
document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", commonEventHandler.showNextHint));
document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSolution));
