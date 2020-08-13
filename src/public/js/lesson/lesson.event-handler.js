import { lessonService } from "./lesson.service.js";
// import { domHelper } from "../helpers/dom.helper.js";

/**
 * DOM elements
 */
const contentPreviewDiv = document.getElementById("content-preview-div");

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    getContentPreview: async event => {
        const data = { katex: event.target.value };
        contentPreviewDiv.innerHTML = await lessonService.getKatexPreview(data);
    },

    // getHintPreview: async event => {
    //     const data = { katex: event.target.value };

    //     const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
    //     const hintPreviewDiv = hintParentDiv.querySelector(".hint-preview-div");
    //     hintPreviewDiv.innerHTML = await exerciseService.getKatexPreview(data);
    // },

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

    toggleContentEditor: async event => {
        const editorTxt = document.getElementById("content-editor-txt");
        editorTxt.classList.toggle("hide-content-editor");

        const editorIsHide = editorTxt.classList.contains("hide-content-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("content-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    }
};
