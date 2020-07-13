import { exerciseService } from "./exercise.service.js";
import { domHelper } from "../helpers/dom.helper.js";

/**
 * DOM elements
 */
const exerciseStatementTxt = document.getElementById("exercise-statement-txt");
const exerciseIdContainer = document.getElementById("exercise-id-container");
const katexPreviewDiv = document.getElementById("katex-preview-div");
const saveStatementStatusIcon = document.getElementById("save-statement-status-icon");

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    getPreview: async () => {
        const data = { exerciseStatement: exerciseStatementTxt.value };
        const katexPreview = await exerciseService.getKatexPreview(data);
        katexPreviewDiv.innerHTML = katexPreview;
    },
    saveExercise: async () => {
        const data = {
            exerciseId: exerciseIdContainer.dataset.exerciseId,
            exerciseStatement: exerciseStatementTxt.value
        };
        const newExercise = await exerciseService.saveExercise(data);
        katexPreviewDiv.innerHTML = newExercise.question.statement.textPreview;

        // show and fadeOut status icon
        domHelper.showAndFadeOut(saveStatementStatusIcon, 500);
    },
    setDefaultContestName: async evt => {
        const selectedContestType = evt.target.value;
        const selectedContestName = evt.target.options[evt.target.selectedIndex].text;
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
    setDefaultSourceName: async evt => {
        const selectedSourceType = evt.target.value;
        const selectedSourceName = evt.target.options[evt.target.selectedIndex].text;
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
