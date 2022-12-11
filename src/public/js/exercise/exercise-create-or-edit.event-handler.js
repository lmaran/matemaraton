import { markdownService } from "../markdown/markdown.service.js";
//import { domHelper } from "../helpers/dom.helper.js";

/**
 * DOM elements
 */
//const exerciseStatementTxt = document.getElementById("statement-editor-txt");
// const exerciseIdContainer = document.getElementById("exercise-id-container");
const statementPreviewDiv = document.getElementById("statement-preview-div");
const answerPreviewDiv = document.getElementById("answer-preview-div");
//const saveStatementStatusIcon = document.getElementById("save-statement-status-icon");

//const exerciseSolutionTxt = document.getElementById("solution-editor-txt");
const solutionPreviewDiv = document.getElementById("solution-preview-div");

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    getStatementPreview: async (event) => {
        const data = { markdown: event.target.value };
        statementPreviewDiv.innerHTML =
            await markdownService.getRenderedMarkdown(data);
    },
    getAnswerPreview: async (event) => {
        const data = { markdown: event.target.value };
        answerPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(
            data
        );
    },
    getSolutionPreview: async (event) => {
        const data = { markdown: event.target.value };
        solutionPreviewDiv.innerHTML =
            await markdownService.getRenderedMarkdown(data);
    },
    handleKeyupForAllHints: async (event) => {
        if (
            event.target &&
            event.target.classList.contains("hint-editor-txt")
        ) {
            const data = { markdown: event.target.value };
            const parentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
            const previewDiv = parentDiv.querySelector(".hint-preview-div");
            previewDiv.innerHTML = await markdownService.getRenderedMarkdown(
                data
            );
        }
    },
    handleKeyupForAllAnswerOptions: async (event) => {
        if (
            event.target &&
            event.target.classList.contains("answer-option-editor-txt")
        ) {
            const data = { markdown: event.target.value };
            const parentDiv = event.target.closest(".answer-option-parent-div"); // find the closest ancestor which matches the selectors
            const previewDiv = parentDiv.querySelector(
                ".answer-option-preview-div"
            );
            previewDiv.innerHTML = await markdownService.getRenderedMarkdown(
                data
            );
        }
    },
    // getHintPreview: async event => {
    //     const data = { markdown: event.target.value };

    //     const hintParentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
    //     const hintPreviewDiv = hintParentDiv.querySelector(".hint-preview-div");
    //     hintPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    // },

    // saveExercise: async () => {
    //     const data = {
    //         exerciseId: exerciseIdContainer.dataset.exerciseId,
    //         exerciseStatement: exerciseStatementTxt.value,
    //         exerciseSolution: exerciseSolutionTxt.value
    //     };
    //     const newExercise = await markdownService.saveExercise(data);
    //     statementPreviewDiv.innerHTML = newExercise.question.statement.textPreview;
    //     solutionPreviewDiv.innerHTML = newExercise.question.solution.textPreview;

    //     // show and fadeOut status icon
    //     domHelper.showAndFadeOut(saveStatementStatusIcon, 500);
    // },
    setDefaultContestName: async (event) => {
        const selectedContestType = event.target.value;
        const selectedContestName =
            event.target.options[event.target.selectedIndex].text;
        const contestNameInput = document.getElementById("contestNameInput");

        switch (selectedContestType) {
            case "olimpiada-locala":
                contestNameInput.value = `${selectedContestName}, <judet>, <anul> (nr_pb)`;
                break;
            case "olimpiada-judeteana":
            case "olimpiada-nationala":
            case "evaluare-nationala":
            case "simulare-evaluare-nationala":
                contestNameInput.value = `${selectedContestName}, <anul>`;
                break;
            case "alte-concursuri":
                contestNameInput.value =
                    "Concurs <nume-concurs>, <oras>, <anul>";
                break;
            default:
                contestNameInput.value = "";
        }
    },
    setDefaultSourceName: async (event) => {
        const selectedSourceType = event.target.value;
        const selectedSourceName =
            event.target.options[event.target.selectedIndex].text;
        const sourceNameInput = document.getElementById("sourceNameInput");

        switch (selectedSourceType) {
            case "gazeta-matematica":
            case "revista-matematică-tm":
                sourceNameInput.value = `${selectedSourceName}, <nr>/<anul>`;
                break;
            case "teme-supliment-gazeta-matematica":
            case "mate2000-excelenta":
            case "mate-olimpiade-ngrigore":
            case "cercuri-mate-pnachila":
                sourceNameInput.value = `${selectedSourceName}, cls.<>, <ex>/<pag>`;
                break;
            case "evaluare-nationala-p45":
                sourceNameInput.value = `${selectedSourceName}, ex.<>/<pag>`;
                break;
            case "mate2000-consolidare":
                sourceNameInput.value = `${selectedSourceName}, cls.<>, partea <>, <ex>/<pag>`;
                break;
            default:
                sourceNameInput.value = "";
        }
    },
    toggleStatementEditor: async (event) => {
        const editorTxt = document.getElementById("statement-editor-txt");
        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("statement-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    toggleAnswerEditor: async (event) => {
        const editorTxt = document.getElementById("answer-editor-txt");
        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("answer-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    toggleSolutionEditor: async (event) => {
        const editorTxt = document.getElementById("solution-editor-txt");
        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("solution-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    handleClickForAllHints: async (event) => {
        // handle 'toggle edit' and 'delete' events
        const target = event.target; // shortcut
        if (target) {
            if (target.classList.contains("toggle-hint-editor-btn")) {
                const parentDiv = target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
                const editorTxt = parentDiv.querySelector(".hint-editor-txt");

                editorTxt.classList.toggle("d-none");

                const editorIsHide = editorTxt.classList.contains("d-none");
                target.textContent = editorIsHide ? "Editează" : "Ascunde";
            } else if (target.classList.contains("delete-hint-btn")) {
                const parentDiv = target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
                parentDiv.remove(); // remove element from DOM (ES6 way)

                updateHintLabels(); // update label for remaining elements
            }
        }
    },
    handleClickForAllAnswerOptions: async (event) => {
        // handle 'toggle edit' and 'delete' events
        const target = event.target; // shortcut
        if (target) {
            if (target.classList.contains("toggle-answer-option-editor-btn")) {
                const parentDiv = target.closest(".answer-option-parent-div"); // find the closest ancestor which matches the selectors
                const editorTxt = parentDiv.querySelector(
                    ".answer-option-editor-txt"
                );

                editorTxt.classList.toggle("d-none");

                const editorIsHide = editorTxt.classList.contains("d-none");
                target.textContent = editorIsHide ? "Editează" : "Ascunde";
            } else if (target.classList.contains("delete-answer-option-btn")) {
                const parentDiv = target.closest(".answer-option-parent-div"); // find the closest ancestor which matches the selectors
                parentDiv.remove(); // remove element from DOM (ES6 way)

                updateAnswerOptionLabels(); // update label for remaining elements
            }
        }
    },

    addHintHtmlNode: async (event) => {
        event.preventDefault();
        const mainDiv = document.getElementById("hint-main-div");
        const nrOfElements = mainDiv.childElementCount;

        const markup = `
            <div class="hint-parent-div mb-4">
                <label class="col-form-label fw-bold"> Indicația ${
                    nrOfElements + 1
                }: </label>

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

                <button type="button" class="delete-hint-btn btn btn-link p-0 mt-n1 float-end">Șterge</button>
                <span class="float-end mt-n1 ms-2 me-2 text-muted"> | </span>
                <button type="button" class="toggle-hint-editor-btn btn btn-link p-0 mt-n1 float-end">Ascunde</button>
            </div>
        `;

        mainDiv.insertAdjacentHTML("beforeend", markup); // much faster that innerHTML
    },

    addAnswerOptionHtmlNode: async (event) => {
        event.preventDefault();
        const mainDiv = document.getElementById("answer-option-main-div");
        const nrOfElements = mainDiv.childElementCount;

        const markup = `
            <div class="answer-option-parent-div mb-4">
                <label class="col-form-label fw-bold"> Răspunsul ${
                    nrOfElements + 1
                }: </label>

                <textarea
                    rows="2"
                    name="answerOptions"
                    style="border-radius:0; border-bottom-width:0; border-color:#bb815d"
                    class="answer-option-editor-txt form-control"
                    value="{{data.solution.val}}"
                ></textarea>

                <div
                    class="answer-option-preview-div"
                    style="border: 1px solid #bb815d; padding: 6px 12px; background-color: #fff9f8; min-height:58px"
                ></div>

                <div class="float-end form-check-inline me-0">
                    <input class="form-check-input" type="checkbox" name="isCorrectAnswerChecks" value=${
                        nrOfElements + 1
                    } id="defaultCheck${nrOfElements + 1}">
                    <label class="form-check-label text-muted" for="defaultCheck${
                        nrOfElements + 1
                    }">
                        Răspuns corect
                    </label>
                    <span class="ms-2 me-2 text-muted"> | </span>
                    <button type="button" class="toggle-answer-option-editor-btn btn btn-link p-0">Editează</button>
                    <span class="ms-2 me-2 text-muted"> | </span>
                    <button type="button" class="delete-answer-option-btn btn btn-link p-0">Șterge</button>
                </div>
            </div>
        `;

        mainDiv.insertAdjacentHTML("beforeend", markup); // much faster that innerHTML
    },
};

const updateHintLabels = () => {
    const mainDiv = document.getElementById("hint-main-div");

    let idx = 0;
    for (const parent of mainDiv.children) {
        const label = parent.querySelector("label");
        label.innerHTML = `Indicația ${++idx}:`;
    }
};

const updateAnswerOptionLabels = () => {
    const mainDiv = document.getElementById("answer-option-main-div");

    let idx = 0;
    for (const parent of mainDiv.children) {
        idx++;
        const label = parent.querySelector("label");
        label.innerHTML = `Opțiunea ${idx}:`;

        // update also checkbox values
        const checkboxInput = parent.querySelector(".form-check-input");
        if (checkboxInput.checked) {
            checkboxInput.value = String(idx);
        }
    }
};
