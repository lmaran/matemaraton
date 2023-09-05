import { eventHandlers } from "../eventHandlers/exercise-list.event-handler.js";
import { commonEventHandler } from "../eventHandlers/course-lesson.common-event-handler.js";

document.getElementById("pageSizeSelect").addEventListener("change", eventHandlers.setPageSize);
document.getElementById("previousPageBtn").addEventListener("click", eventHandlers.handleClickForAllPaginationButttons);
document.getElementById("nextPageBtn").addEventListener("click", eventHandlers.handleClickForAllPaginationButttons);

// common
document.querySelectorAll(".toggle-level-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleLevel));

document.querySelectorAll(".toggle-answer-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleAnswer));
document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleHints));
document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", commonEventHandler.showNextHint));
document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSolution));
