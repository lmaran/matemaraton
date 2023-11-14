/**
 * event handlers (alias 'controller')
 */
export const commonEventHandler = {
    updateCartButtons: async () => {
        const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        if (cartItems) {
            document.querySelectorAll(".add-to-cart-btn").forEach((target) => {
                const exerciseId = target.dataset.exerciseId;

                const find = cartItems.find((x) => x == exerciseId);
                if (find) {
                    target.classList.add("d-none");

                    const parentDiv = target.closest(".exercise-menu-div");
                    const removeFromCartBtn = parentDiv.querySelector(".remove-from-cart-btn");
                    if (removeFromCartBtn) removeFromCartBtn.classList.remove("d-none");
                }
            });
        }
    },

    addToCart: async (event) => {
        const target = event.target; // shortcut
        const exerciseId = target.dataset.exerciseId;

        const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        cartItems.push(exerciseId);
        localStorage.setItem("cart", JSON.stringify(cartItems));

        target.classList.add("d-none");

        const parentDiv = target.closest(".exercise-menu-div");
        const removeFromCartBtn = parentDiv.querySelector(".remove-from-cart-btn");
        if (removeFromCartBtn) removeFromCartBtn.classList.remove("d-none");

        // in main.event-handler.js we have a listener that updates the chart icon: https://stackoverflow.com/a/65348883
        window.dispatchEvent(new Event("storage"));
    },

    removeFromCart: async (event) => {
        const target = event.target; // shortcut
        const exerciseId = target.dataset.exerciseId;

        let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        cartItems = cartItems.filter((x) => x !== exerciseId);
        localStorage.setItem("cart", JSON.stringify(cartItems));

        target.classList.add("d-none");

        const parentDiv = target.closest(".exercise-menu-div");
        const addToCartBtn = parentDiv.querySelector(".add-to-cart-btn");
        if (addToCartBtn) addToCartBtn.classList.remove("d-none");

        // in main.event-handler.js we have a listener that updates the chart icon: https://stackoverflow.com/a/65348883
        window.dispatchEvent(new Event("storage"));
    },

    toggleSection: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        const parentDiv = target.closest("section");
        const sectionContentDiv = parentDiv.querySelector(".section-content-div");

        sectionContentDiv.classList.toggle("d-none");

        const sectionDivIsHide = sectionContentDiv.classList.contains("d-none");
        target.textContent = sectionDivIsHide ? "Afișează" : "Ascunde exercițiile";
    },

    toggleAnswer: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        const parentDiv = target.closest(".exercise-div");
        const answerDiv = parentDiv.querySelector(".answer-div");

        answerDiv.classList.toggle("d-none");

        const answerDivIsHide = answerDiv.classList.contains("d-none");
        target.textContent = answerDivIsHide ? "Răspuns" : "Ascunde răspunsul";

        // hide the other panels
        // hideHints(parentDiv);
        hideSolution(parentDiv);
    },

    toggleHints: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

        const parentDiv = target.closest(".exercise-div");
        const hintsDiv = parentDiv.querySelector(".hints-div");

        hintsDiv.classList.toggle("d-none");

        const hintsDivIsHide = hintsDiv.classList.contains("d-none");
        target.textContent = hintsDivIsHide ? "Indicații" : "Ascunde indicațiile";
        target.nextElementSibling.classList.toggle("d-none"); // hide the number of hints

        // hide the other panels
        // hideAnswer(parentDiv);
        hideSolution(parentDiv);
    },

    showNextHint: async (event) => {
        event.preventDefault();
        const target = event.target; // shortcut

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

        // hide the other panels
        hideAnswer(parentDiv);
        hideHints(parentDiv);
    },
};

const hideHints = (parentDiv) => {
    const hintsDiv = parentDiv.querySelector(".hints-div");
    if (hintsDiv) hintsDiv.classList.add("d-none");

    const toggleHintsBtn = parentDiv.querySelector(".toggle-hints-btn");
    if (toggleHintsBtn) {
        toggleHintsBtn.textContent = "Indicații";
        toggleHintsBtn.nextElementSibling.classList.remove("d-none"); // show the number of hints
    }
};

const hideAnswer = (parentDiv) => {
    const answerDiv = parentDiv.querySelector(".answer-div");
    if (answerDiv) answerDiv.classList.add("d-none");

    const toggleAnswerBtn = parentDiv.querySelector(".toggle-answer-btn");
    if (toggleAnswerBtn) toggleAnswerBtn.textContent = "Răspuns";
};

const hideSolution = (parentDiv) => {
    const solutionDiv = parentDiv.querySelector(".solution-div");
    if (solutionDiv) solutionDiv.classList.add("d-none");

    const toggleSolutionBtn = parentDiv.querySelector(".toggle-solution-btn");
    if (toggleSolutionBtn) toggleSolutionBtn.textContent = "Soluție";
};
