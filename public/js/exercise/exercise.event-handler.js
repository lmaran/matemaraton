import { exerciseService } from "./exercise.service.js";
// import { domHelper } from "../helpers/dom.helper.js";

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
    handleKeyupForAllHints: async event => {
        if (event.target && event.target.classList.contains("hint-editor-txt")) {
            const data = { katex: event.target.value };
            const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
            const hintPreviewDiv = hintParentDiv.querySelector(".hint-preview-div");
            hintPreviewDiv.innerHTML = await exerciseService.getKatexPreview(data);
        }
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
        const editorTxt = document.getElementById("statement-editor-txt");
        editorTxt.classList.toggle("hide-statement-editor");

        const editorIsHide = editorTxt.classList.contains("hide-statement-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("statement-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    toggleSolutionEditor: async event => {
        const editorTxt = document.getElementById("solution-editor-txt");
        editorTxt.classList.toggle("hide-solution-editor");

        const editorIsHide = editorTxt.classList.contains("hide-solution-editor");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("solution-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    handleClickForAllHints: async event => {
        // handle 'toggle edit' and 'delete' events
        if (event.target) {
            if (event.target.classList.contains("toggle-hint-editor-btn")) {
                const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
                const editorTxt = hintParentDiv.querySelector(".hint-editor-txt");

                editorTxt.classList.toggle("hide-hint-editor");

                const editorIsHide = editorTxt.classList.contains("hide-hint-editor");
                event.target.textContent = editorIsHide ? "Editează" : "Ascunde";
            } else if (event.target.classList.contains("delete-hint-btn")) {
                const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
                hintParentDiv.remove(); // remove element from DOM (ES6 way)

                updateHintLabels(); // update label for remaining hints
            }
        }
    },

    addHintHtmlNode: async event => {
        event.preventDefault();
        const hintMainDiv = document.getElementById("hint-main-div");
        const NrOfHints = hintMainDiv.childElementCount;

        const markup = `
            <div class="hint-parent-div mb-4">
                <label class="col-form-label font-weight-bold"> Indicația ${NrOfHints + 1}: </label>

                <textarea
                    rows="2"
                    name="hints"
                    style="border-radius:0; border-bottom-width:0; border-color:#007bff"
                    class="hint-editor-txt form-control"
                    value="{{data.solution.val}}"
                ></textarea>

                <div
                    class="hint-preview-div"
                    style="border: 1px solid #007bff; padding: 6px 12px; background-color: #f5faff; min-height:58px"
                ></div>

                <button type="button" class="delete-hint-btn btn btn-link p-0 mt-n1 float-right">Șterge</button>
                <span class="float-right mt-n1 ml-2 mr-2 text-muted"> | </span>
                <button type="button" class="toggle-hint-editor-btn btn btn-link p-0 mt-n1 float-right">Ascunde</button>
            </div>
        `;

        hintMainDiv.insertAdjacentHTML("beforeend", markup); // much faster that innerHTML
    }
};

const updateHintLabels = () => {
    const hintMainDiv = document.getElementById("hint-main-div");

    let idx = 0;
    for (const hintParent of hintMainDiv.children) {
        const hintLabel = hintParent.querySelector("label");
        hintLabel.innerHTML = `Indicația ${++idx}:`;
    }
};
