import { markdownService } from "../services/markdown.service.js";

const titlePreviewDiv = document.getElementById("title-preview-div");
// const answerPreviewDiv = document.getElementById("answer-preview-div");
// const solutionPreviewDiv = document.getElementById("solution-preview-div");

export const eventHandlers = {
    onDOMContentLoaded: async () => {
        //const nameInput = document.getElementById("nameInput");
        //const timezoneOffset = new Date().getTimezoneOffset();
        // nameInput.value = `Fișa ${new Date()}`;
    },
    getTitlePreview: async (event) => {
        const data = { markdown: event.target.value };
        titlePreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    },
    // getAnswerPreview: async (event) => {
    //     const data = { markdown: event.target.value };
    //     answerPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    // },
    // getSolutionPreview: async (event) => {
    //     const data = { markdown: event.target.value };
    //     solutionPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    // },
    handleKeyupForAllHints: async (event) => {
        if (event.target && event.target.classList.contains("hint-editor-txt")) {
            const data = { markdown: event.target.value };
            const parentDiv = event.target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
            const previewDiv = parentDiv.querySelector(".hint-preview-div");
            previewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
        }
    },
    handleKeyupForAllAnswerOptions: async (event) => {
        if (event.target && event.target.classList.contains("answer-option-editor-txt")) {
            const data = { markdown: event.target.value };
            const parentDiv = event.target.closest(".answer-option-parent-div"); // find the closest ancestor which matches the selectors
            const previewDiv = parentDiv.querySelector(".answer-option-preview-div");
            previewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
        }
    },

    setDefaultSheetType: async (event) => {
        const selectedExerciseType = event.target.value;

        const answerMainRow = document.getElementById("answer-main-row");
        const answerOptionMainRow = document.getElementById("answer-option-main-row");

        const answerType1Lbl = document.getElementById("answer-type1-lbl");
        const answerType3Lbl = document.getElementById("answer-type3-lbl");

        switch (selectedExerciseType) {
            case "1":
            case "3":
                answerMainRow.classList.remove("d-none");
                answerOptionMainRow.classList.add("d-none");

                if (selectedExerciseType == "1") {
                    answerType1Lbl.classList.remove("d-none");
                    answerType3Lbl.classList.add("d-none");
                } else {
                    answerType1Lbl.classList.add("d-none");
                    answerType3Lbl.classList.remove("d-none");
                }

                break;
            case "2":
                answerMainRow.classList.add("d-none");
                answerOptionMainRow.classList.remove("d-none");
                break;
        }
    },
    // toggleTitleEditor: async (event) => {
    //     event.preventDefault();

    //     const editorTxt = document.getElementById("statement-editor-txt");
    //     editorTxt.classList.toggle("d-none");

    //     const editorIsHide = editorTxt.classList.contains("d-none");
    //     event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

    //     const previewDiv = document.getElementById("statement-preview-div");
    //     previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    // },

    // toggleAnswerEditor: async (event) => {
    //     event.preventDefault();

    //     const editorTxt = document.getElementById("answer-editor-txt");
    //     editorTxt.classList.toggle("d-none");

    //     const editorIsHide = editorTxt.classList.contains("d-none");
    //     event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

    //     const previewDiv = document.getElementById("answer-preview-div");
    //     previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    // },
    // toggleSolutionEditor: async (event) => {
    //     event.preventDefault();

    //     const editorTxt = document.getElementById("solution-editor-txt");
    //     editorTxt.classList.toggle("d-none");

    //     const editorIsHide = editorTxt.classList.contains("d-none");
    //     event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

    //     const previewDiv = document.getElementById("solution-preview-div");
    //     previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    // },
    // handleClickForAllHints: async (event) => {
    //     event.preventDefault();
    //     // if (target.tagName != "INPUT") event.preventDefault();

    //     // handle 'toggle edit' and 'delete' events
    //     const target = event.target; // shortcut
    //     if (target) {
    //         if (target.classList.contains("toggle-hint-editor-btn")) {
    //             const parentDiv = target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
    //             const editorTxt = parentDiv.querySelector(".hint-editor-txt");

    //             editorTxt.classList.toggle("d-none");

    //             const editorIsHide = editorTxt.classList.contains("d-none");
    //             target.textContent = editorIsHide ? "Editează" : "Ascunde";
    //         } else if (target.classList.contains("delete-hint-btn")) {
    //             const parentDiv = target.closest(".hint-parent-div"); // find the closest ancestor which matches the selectors
    //             parentDiv.remove(); // remove element from DOM (ES6 way)

    //             updateHintLabels(); // update label for remaining elements
    //         }
    //     }
    // },
    // handleClickForAllAnswerOptions: async (event) => {
    //     // handle 'toggle edit' and 'delete' events
    //     const target = event.target; // shortcut
    //     if (target) {
    //         if (target.tagName != "INPUT") event.preventDefault();

    //         if (target.classList.contains("toggle-answer-option-editor-btn")) {
    //             const parentDiv = target.closest(".answer-option-parent-div"); // find the closest ancestor which matches the selectors
    //             const editorTxt = parentDiv.querySelector(".answer-option-editor-txt");

    //             editorTxt.classList.toggle("d-none");

    //             const editorIsHide = editorTxt.classList.contains("d-none");
    //             target.textContent = editorIsHide ? "Editează" : "Ascunde";
    //         } else if (target.classList.contains("delete-answer-option-btn")) {
    //             const parentDiv = target.closest(".answer-option-parent-div"); // find the closest ancestor which matches the selectors
    //             parentDiv.remove(); // remove element from DOM (ES6 way)

    //             updateAnswerOptionLabels(); // update label for remaining elements
    //         }
    //     }
    // },

    // addHintHtmlNode: async (event) => {
    //     event.preventDefault();
    //     const mainDiv = document.getElementById("hint-main-div");
    //     const nrOfElements = mainDiv.childElementCount;

    //     const markup = `
    //         <div class="col-md-12 hint-parent-div mb-4">
    //             <label class="col-form-label fw-bold"> Indicația ${nrOfElements + 1}: </label>

    //             <textarea
    //                 rows="2"
    //                 name="hints"
    //                 style="border-radius:0; border-bottom-width:0; border-color:#007bff"
    //                 class="hint-editor-txt form-control"
    //                 value="{{data.solution.val}}"
    //             ></textarea>

    //             <div
    //                 class="hint-preview-div"
    //                 style="border: 1px solid #007bff; padding: 6px 12px; background-color: #f5faff; min-height:58px"
    //             ></div>

    //             <button type="button" class="delete-hint-btn btn btn-link p-0 mt-n1 float-end">Șterge</button>
    //             <span class="float-end mt-n1 ms-2 me-2 text-muted"> | </span>
    //             <button type="button" class="toggle-hint-editor-btn btn btn-link p-0 mt-n1 float-end">Ascunde</button>
    //         </div>
    //     `;

    //     mainDiv.insertAdjacentHTML("beforeend", markup); // much faster that innerHTML
    // },

    // addAnswerOptionHtmlNode: async (event) => {
    //     event.preventDefault();
    //     const mainDiv = document.getElementById("answer-option-main-div");
    //     const nrOfElements = mainDiv.childElementCount;

    //     const markup = `
    //         <div class="answer-option-parent-div mb-4">
    //             <label class="col-form-label fw-bold"> Variantă de răspuns ${nrOfElements + 1}: </label>

    //             <textarea
    //                 rows="2"
    //                 name="answerOptions"
    //                 style="border-radius:0; border-bottom-width:0; border-color:#bb815d"
    //                 class="answer-option-editor-txt form-control"
    //                 value="{{data.solution.val}}"
    //             ></textarea>

    //             <div
    //                 class="answer-option-preview-div"
    //                 style="border: 1px solid #bb815d; padding: 6px 12px; background-color: #fff9f8; min-height:58px"
    //             ></div>

    //             <div class="float-end">
    //                 <input class="form-check-input" type="checkbox" name="isCorrectAnswerChecks" value=${nrOfElements + 1} id="defaultCheck${
    //         nrOfElements + 1
    //     }">
    //                 <label class="form-check-label text-muted" for="defaultCheck${nrOfElements + 1}">
    //                     Răspuns corect
    //                 </label>
    //                 <span class="ms-2 me-2 text-muted"> | </span>
    //                 <a class="toggle-answer-option-editor-btn" href="">Editează</a>
    //                 <span class="ms-2 me-2 text-muted"> | </span>
    //                 <a class="delete-answer-option-btn" href="">Șterge</a>
    //             </div>
    //         </div>
    //     `;

    //     mainDiv.insertAdjacentHTML("beforeend", markup); // much faster that innerHTML
    // },
};

// const updateHintLabels = () => {
//     const mainDiv = document.getElementById("hint-main-div");

//     let idx = 0;
//     for (const parent of mainDiv.children) {
//         const label = parent.querySelector("label");
//         label.innerHTML = `Indicația ${++idx}:`;
//     }
// };

// const updateAnswerOptionLabels = () => {
//     const mainDiv = document.getElementById("answer-option-main-div");

//     let idx = 0;
//     for (const parent of mainDiv.children) {
//         idx++;
//         const label = parent.querySelector("label");
//         label.innerHTML = `Variantă de răspuns ${idx}:`;

//         // update also checkbox values
//         const checkboxInput = parent.querySelector(".form-check-input");
//         if (checkboxInput.checked) {
//             checkboxInput.value = String(idx);
//         }
//     }
// };
