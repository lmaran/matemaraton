/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    toggleLevel: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        //const parentDiv = target.parentElement;
        //const levelDiv = parentDiv.nextElementSibling;

        // const parentDiv = target.closest(".exercise-div");
        // const levelDiv = parentDiv.querySelector(".level-div");

        const parentDiv = target.closest(".level-menu-div");
        const levelContentDiv = parentDiv.nextElementSibling;

        levelContentDiv.classList.toggle("d-none");

        const levelDivIsHide = levelContentDiv.classList.contains("d-none");
        target.textContent = levelDivIsHide ? "Afișează" : "Ascunde exercițiile";
    },

    toggleHints: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        // const parentDiv = target.parentElement;
        // const hintsDiv = parentDiv.nextElementSibling;

        const parentDiv = target.closest(".exercise-div");
        const hintsDiv = parentDiv.querySelector(".hints-div");

        hintsDiv.classList.toggle("d-none");

        const hintsDivIsHide = hintsDiv.classList.contains("d-none");
        target.textContent = hintsDivIsHide ? "Indicații" : "Ascunde indicațiile";
        target.nextElementSibling.classList.toggle("d-none"); // hide the number of hints
    },

    showNextHint: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        // const parentDiv = target.parentElement;
        // const nextDiv = parentDiv.querySelector(".d-none");
        // nextDiv.classList.remove("d-none");

        const parentDiv = target.closest(".exercise-div");
        const hintsDiv = parentDiv.querySelector(".hints-div");
        const nextDiv = hintsDiv.querySelector(".d-none");
        nextDiv.classList.remove("d-none");

        const totalHints = hintsDiv.dataset.totalHints;
        const hintNr = nextDiv.dataset.hintNr;

        if (hintNr === totalHints) {
            target.classList.add("d-none");
        }
    },

    toggleSolution: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        const parentDiv = target.closest(".exercise-div");
        const solutionDiv = parentDiv.querySelector(".solution-div");

        solutionDiv.classList.toggle("d-none");

        const solutionDivIsHide = solutionDiv.classList.contains("d-none");
        target.textContent = solutionDivIsHide ? "Soluție" : "Ascunde soluția";
    },
};
