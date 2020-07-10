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
    }
};

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
