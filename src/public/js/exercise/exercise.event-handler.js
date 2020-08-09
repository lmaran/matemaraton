import { exerciseService } from "./exercise.service.js";
import { domHelper } from "../helpers/dom.helper.js";

/**
 * DOM elements
 */
//const exerciseStatementTxt = document.getElementById("statement-editor-txt");
// const exerciseIdContainer = document.getElementById("exercise-id-container");
const statementPreviewDiv = document.getElementById("statement-preview-div");
//const saveStatementStatusIcon = document.getElementById("save-statement-status-icon");

//const exerciseSolutionTxt = document.getElementById("solution-editor-txt");
const solutionPreviewDiv = document.getElementById("solution-preview-div");

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    getStatementPreview: async event => {
        const data = { katex: event.target.value };
        statementPreviewDiv.innerHTML = await exerciseService.getKatexPreview(data);
    },
    getSolutionPreview: async event => {
        const data = { katex: event.target.value };
        solutionPreviewDiv.innerHTML = await exerciseService.getKatexPreview(data);
    },
    getHintPreview: async event => {
        const data = { katex: event.target.value };

        const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
        const hintPreviewDiv = hintParentDiv.querySelector(".hint-preview-div");
        hintPreviewDiv.innerHTML = await exerciseService.getKatexPreview(data);
    },
    // saveExercise: async () => {
    //     const data = {
    //         exerciseId: exerciseIdContainer.dataset.exerciseId,
    //         exerciseStatement: exerciseStatementTxt.value,
    //         exerciseSolution: exerciseSolutionTxt.value
    //     };
    //     const newExercise = await exerciseService.saveExercise(data);
    //     statementPreviewDiv.innerHTML = newExercise.question.statement.textPreview;
    //     solutionPreviewDiv.innerHTML = newExercise.question.solution.textPreview;

    //     // show and fadeOut status icon
    //     domHelper.showAndFadeOut(saveStatementStatusIcon, 500);
    // },
    setDefaultContestName: async event => {
        const selectedContestType = event.target.value;
        const selectedContestName = event.target.options[event.target.selectedIndex].text;
        const contestNameInput = document.getElementById("contestNameInput");

        switch (selectedContestType) {
            case "olimpiada-locala":
                contestNameInput.value = `${selectedContestName}, <judet>, <anul>`;
                break;
            case "olimpiada-judeteana":
            case "olimpiada-nationala":
            case "evaluare-nationala":
            case "simulare-evaluare-nationala":
                contestNameInput.value = `${selectedContestName}, <anul>`;
                break;
            case "alte-concursuri":
                contestNameInput.value = "Concurs <nume-concurs>, <oras>, <anul>";
                break;
            default:
                contestNameInput.value = "";
        }
    },
    setDefaultSourceName: async event => {
        const selectedSourceType = event.target.value;
        const selectedSourceName = event.target.options[event.target.selectedIndex].text;
        const sourceNameInput = document.getElementById("sourceNameInput");

        switch (selectedSourceType) {
            case "gazeta-matematica":
            case "revista-matematică-tm":
                sourceNameInput.value = `${selectedSourceName}, nr.<>/<anul>`;
                break;
            case "teme-supliment-gazeta-matematica":
            case "mate2000-excelenta":
            case "mate-olimpiade-ngrigore":
            case "cercuri-mate-pnachila":
                sourceNameInput.value = `${selectedSourceName}, cls.<>, ex.<>/<pag>`;
                break;
            case "evaluare-nationala-p45":
                sourceNameInput.value = `${selectedSourceName}, ex.<>/<pag>`;
                break;
            case "mate2000-consolidare":
                sourceNameInput.value = `${selectedSourceName}, cls.<>, partea <>, ex.<>/<pag>`;
                break;
            default:
                sourceNameInput.value = "";
        }
    },
    toggleStatementEditor: async event => {
        const editorDiv = document.getElementById("statement-editor-div");
        editorDiv.classList.toggle("hide-statement-editor");

        const editorIsHide = editorDiv.classList.contains("hide-statement-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("statement-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    toggleSolutionEditor: async event => {
        const editorDiv = document.getElementById("solution-editor-div");
        editorDiv.classList.toggle("hide-solution-editor");

        const editorIsHide = editorDiv.classList.contains("hide-solution-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("solution-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    toggleHintEditor: async event => {
        const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
        const editorDiv = hintParentDiv.querySelector(".hint-editor-div");

        editorDiv.classList.toggle("hide-hint-editor");

        const editorIsHide = editorDiv.classList.contains("hide-hint-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";
    }
};

// const sourceTypeAvailableOptions = [
//     { text: "Gazeta Matematică", value: "gazeta-matematica" },
//     { text: "Revista de Matematică din Timișoara", value: "revista-matematică-tm" },
//     { text: "Culegere 'Teme supliment Gazeta Matematică'", value: "teme-supliment-gazeta-matematica" },
//     { text: "Culegere 'Matematică de excelență', Ed. Paralela 45", value: "mate2000-excelenta" },
//     {
//         text: "Culegere 'Matematică pt. olimpiade și concursuri', N. Grigore, Ed. Nomina",
//         value: "mate-olimpiade-ngrigore"
//     },
//     {
//         text: "Culegere 'Exerciții pt. cercurile de matematică', P. Năchilă, Ed. Nomina",
//         value: "cercuri-mate-pnachila"
//     },
//     { text: "Culegere 'Matematică de consolidare', Ed. Paralela 45", value: "mate2000-consolidare" },
//     { text: "Culegere 'Evaluarea Națională', Ed. Paralela 45", value: "evaluare-nationala-p45" }
// ];

/**
 * internal helpers
 */

// async function showAndFadeOut(elem, milliseconds) {
//     elem.classList.add("show");
//     elem.classList.remove("hide");

//     await dateTimeHelper.sleepAsync(milliseconds); // fade out after x milliseconds (instead of using setTimeout)

//     elem.classList.add("hide");
//     elem.classList.remove("show");
// }
