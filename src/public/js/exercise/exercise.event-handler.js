// import { exerciseService } from "./exercise.service.js";
// import { domHelper } from "../helpers/dom.helper.js";

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    toggleAnswer: async event => {
        const div = document.getElementById("answer-div");
        div.classList.toggle("d-none");

        const divIsHide = div.classList.contains("d-none");
        event.target.textContent = divIsHide ? "Rezultat final" : "Ascunde rezultatul";
    },
    toggleHints: async event => {
        const div = document.getElementById("hints-div");
        div.classList.toggle("d-none");

        const divIsHide = div.classList.contains("d-none");
        event.target.textContent = divIsHide ? "Indicații" : "Ascunde indicațiile";
    },
    toggleSolution: async event => {
        const div = document.getElementById("solution-div");
        div.classList.toggle("d-none");

        const divIsHide = div.classList.contains("d-none");
        event.target.textContent = divIsHide ? "Rezolvare completă" : "Ascunde rezolvarea";
    },
    showNextHint: async () => {
        const parentDiv = document.getElementById("hints-div");
        const nextDiv = parentDiv.querySelector(".d-none");
        nextDiv.classList.remove("d-none");

        const totalHints = parentDiv.dataset.totalHints;
        const hintNr = nextDiv.dataset.hintNr;

        if (hintNr === totalHints) {
            document.getElementById("show-next-hint-btn").classList.add("d-none");
        }
    }
};
