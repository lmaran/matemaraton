import { eventHandlers } from "./exercise.event-handler.js";

/**
 * event binders (alias 'router')
 */

const toggleAnswerBtn = document.getElementById("toggle-answer-btn");
if (toggleAnswerBtn) toggleAnswerBtn.addEventListener("click", eventHandlers.toggleAnswer);

const toggleHintsBtn = document.getElementById("toggle-hints-btn");
if (toggleHintsBtn) toggleHintsBtn.addEventListener("click", eventHandlers.toggleHints);

const toggleSolutionBtn = document.getElementById("toggle-solution-btn");
if (toggleSolutionBtn) toggleSolutionBtn.addEventListener("click", eventHandlers.toggleSolution);

const showNextHintBtn = document.getElementById("show-next-hint-btn");
if (showNextHintBtn) showNextHintBtn.addEventListener("click", eventHandlers.showNextHint);
