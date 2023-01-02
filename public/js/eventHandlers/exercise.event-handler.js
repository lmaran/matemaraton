import { exerciseService } from "..services/exercise.service.js";

export const eventHandlers = {
    toggleAnswer: async (event) => {
        const div = document.getElementById("answer-div");
        div.classList.toggle("d-none");

        const divIsHide = div.classList.contains("d-none");
        event.target.textContent = divIsHide ? "Rezultat final" : "Ascunde rezultatul";
    },
    toggleHints: async (event) => {
        const div = document.getElementById("hints-div");
        div.classList.toggle("d-none");

        const divIsHide = div.classList.contains("d-none");
        event.target.textContent = divIsHide ? "Indicații" : "Ascunde indicațiile";
    },
    toggleSolution: async (event) => {
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
    },

    submitMySolution: async (event) => {
        const exerciseIdContainer = document.getElementById("exercise-id-container");
        const exerciseId = exerciseIdContainer.dataset.exerciseId;

        const dropArea = event.target.closest(".drop-area"); // find the closest ancestor which matches the selectors
        const comment = dropArea.querySelector(".comment-textarea").value;

        const fileContainers = dropArea.querySelectorAll(".file-container-span");
        const files = [];
        for (const fileContainer of fileContainers) {
            files.push({ url: fileContainer.dataset.url });
        }

        const data = { exerciseId, submittedSolution: { comment, files } };

        await exerciseService.submitMySolution(data);
    },
};
