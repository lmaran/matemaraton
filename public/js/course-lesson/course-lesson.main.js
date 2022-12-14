import { eventHandlers } from "./course-lesson.event-handler.js";

/**
 * event binders (alias 'router')
 */

// const toggleAnswerBtn = document.getElementById("toggle-answer-btn");
// if (toggleAnswerBtn) toggleAnswerBtn.addEventListener("click", eventHandlers.toggleAnswer);

// const toggleHintsBtn = document.getElementById("toggle-hints-btn");
// if (toggleHintsBtn) toggleHintsBtn.addEventListener("click", eventHandlers.toggleHints);

document.querySelectorAll(".toggle-level-btn").forEach((item) => item.addEventListener("click", eventHandlers.toggleLevel));

document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", eventHandlers.toggleHints));

document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", eventHandlers.showNextHint));

document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", eventHandlers.toggleSolution));

// const showNextHintBtn = document.getElementById("show-next-hint-btn");
// if (showNextHintBtn) showNextHintBtn.addEventListener("click", eventHandlers.showNextHint);

// const toggleSolutionBtn = document.getElementById("toggle-solution-btn");
// if (toggleSolutionBtn) toggleSolutionBtn.addEventListener("click", eventHandlers.toggleSolution);
