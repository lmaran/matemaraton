import { commonEventHandler } from "../eventHandlers/course-lesson.common-event-handler.js";

// common
document.querySelectorAll(".toggle-section-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSection));

document.querySelectorAll(".toggle-answer-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleAnswer));
document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleHints));
document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", commonEventHandler.showNextHint));
document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSolution));

document.querySelectorAll(".add-to-cart-btn").forEach((item) => item.addEventListener("click", commonEventHandler.addToCart));
document.querySelectorAll(".remove-from-cart-btn").forEach((item) => item.addEventListener("click", commonEventHandler.removeFromCart));
document.addEventListener("DOMContentLoaded", commonEventHandler.updateCartButtons);
