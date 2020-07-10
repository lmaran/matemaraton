import { fetchHelpers } from "../helpers/fetch.helper.js";

// event binders
const exerciseStatementTxt = document.getElementById("exercise-statement-txt");
//const previewBtn = document.getElementById("preview-btn");
const saveBtn = document.getElementById("save-btn");

//const problemIdContainer = document.querySelector(".problem-id-container");
const exerciseIdContainer = document.getElementById("exercise-id-container");

// const resultDivOriginal = document.getElementById("result-div-original");
// const resultDivOriginalFormatted = document.getElementById("result-div-original-formatted");
const katexPreviewDiv = document.getElementById("katex-preview-div");
const saveStatementCheckIcon = document.getElementById("save-statement-check-icon");

// init
// const initStr = `
// # Triangle Let the right triangle hypothenuse be aligned with the coordinate system *x-axis*. The vector loop closure equation then reads $$a{\bold e}_\alpha + b\tilde{\bold e}_\alpha + c{\bold e}_x = \bold 0$$ (1) with $${\bold e}_\alpha = \begin{pmatrix}\cos\alpha\\ \sin\alpha\end{pmatrix} \quad and \quad {\tilde\bold e}_\alpha = \begin{pmatrix}-\sin\alpha\\ \cos\alpha\end{pmatrix}$$ Resolving for the hypothenuse part $c{\bold e}_x$ in the loop closure equation (1) $$-c{\bold e}_x = a{\bold e}_\alpha + b\tilde{\bold e}_\alpha$$ and squaring > finally results in the Pythagorean theorem (2) > > $$ c^2 = a^2 + b^2 $$ (2)
// `;

// const initStr =
//     "# Triangle \n\nLet the right triangle hypothenuse be aligned with the coordinate system *x-axis*. \nThe vector loop closure equation then reads\n\n$$a{\\bold e}_\\alpha + b\\tilde{\\bold e}_\\alpha + c{\\bold e}_x = \\bold 0$$ (1)\n\nwith\n\n$${\\bold e}_\\alpha = \\begin{pmatrix}\\cos\\alpha\\\\ \\sin\\alpha\\end{pmatrix} \\quad and \\quad {\\tilde\\bold e}_\\alpha = \\begin{pmatrix}-\\sin\\alpha\\\\ \\cos\\alpha\\end{pmatrix}$$\n\nResolving for the hypothenuse part $c{\\bold e}_x$ in the loop closure equation (1) \n\n$$-c{\\bold e}_x = a{\\bold e}_\\alpha + b\\tilde{\\bold e}_\\alpha$$\n\nand squaring \n\n> finally results in the Pythagorean theorem (2)\n>\n> $$ c^2 = a^2 + b^2 $$ (2)";

// demo here https://goessner.github.io/markdown-it-texmath/markdown-it-texmath-demo.html
// const initStr =
//     "Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\space x$ divizor al lui 10 $\\}.$\\\na) Scrieți elementele mulțimilor $A$ si $B$.\\\nb) Scrieți elementele mulțimilor $A$ si $B$.\n\nResolving for the hypothenuse part $c{\\bold e}_x$ in the loop closure equation (1) \n\n$$-c{\\bold e}_x = a{\\bold e}_\\alpha + b\\tilde{\\bold e}_\\alpha$$ (2)";

// questionTxt.value = initStr;

// event handlers
const eventHandlers = {
    getPreview: async () => {
        const data = { exerciseStatement: exerciseStatementTxt.value };
        const katexPreview = await getKatexPreview(data);
        katexPreviewDiv.innerHTML = katexPreview;
    },
    saveExercise: async () => {
        const data = {
            exerciseId: exerciseIdContainer.dataset.exerciseId,
            exerciseStatement: exerciseStatementTxt.value
        };
        const newExercise = await saveExercise(data);
        katexPreviewDiv.innerHTML = newExercise.question.statement.textPreview;

        saveStatementCheckIcon.classList.add("show");
        saveStatementCheckIcon.classList.remove("hide");

        setTimeout(function() {
            saveStatementCheckIcon.classList.add("hide");
            saveStatementCheckIcon.classList.remove("show");
        }, 3000);
    }
    // runPreview: async () => {
    //     const data = { problemId: problemIdContainer.dataset.problemId, problemStatement: problemStatementTxt.value };
    //     const newProblem = await saveProblem(data);
    //     // console.log(newProblem);
    //     katexPreviewDiv.innerHTML = newProblem.question.statement.textPreview;
    // }
};

//https://chrisboakes.com/how-a-javascript-debounce-function-works/
function debounce(callback, wait) {
    let timeout;
    return (...args) => {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(context, args), wait);
    };
}

//previewBtn.addEventListener("click", eventHandlers.getPreview);
saveBtn.addEventListener("click", eventHandlers.saveExercise);

// problemStatementTxt.addEventListener("keyup", eventHandlers.getPreview); // without debouncer
exerciseStatementTxt.addEventListener("keyup", debounce(eventHandlers.getPreview, 500)); // with debouncer

// http services
const getKatexPreview = async data => {
    return fetchHelpers.post("/exercitii/katex-preview", data);
};

const saveExercise = async data => {
    return fetchHelpers.put(`/exercitii/${data.exerciseId}`, data);
};
