import { eventHandlers } from "./exercise.event-handler.js";

/**
 * event binders (alias 'router')
 */

document.getElementById("toggle-answer-btn").addEventListener("click", eventHandlers.toggleAnswer);
document.getElementById("toggle-hints-btn").addEventListener("click", eventHandlers.toggleHints);
document.getElementById("toggle-solution-btn").addEventListener("click", eventHandlers.toggleSolution);
document.getElementById("view-next-hint-btn").addEventListener("click", eventHandlers.showNextHint);
