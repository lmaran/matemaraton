import { eventHandlers } from "./exercise.event-handler.js";

/**
 * event binders (alias 'router')
 */

const toggleAnswerBtn = document.getElementById("toggle-answer-btn");
if (toggleAnswerBtn) toggleAnswerBtn.addEventListener("click", eventHandlers.toggleAnswer);

const toggleHintsBtn = document.getElementById("toggle-hints-btn");
if (toggleHintsBtn) toggleHintsBtn.addEventListener("click", eventHandlers.toggleHints);

const toggleSolutionBtn = document.getElementById("toggle-solution-btn");
if (toggleSolutionBtn) toggleHintsBtn.addEventListener("click", eventHandlers.toggleSolution);

const toggleNextHintBtn = document.getElementById("toggle-next-hint-btn");
if (toggleNextHintBtn) toggleHintsBtn.addEventListener("click", eventHandlers.showNextHint);
