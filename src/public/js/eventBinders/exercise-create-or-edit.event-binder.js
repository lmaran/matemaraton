import { eventHandlers } from "../eventHandlers/exercise-create-or-edit.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { uploadFilesHelper } from "../helpers/upload-files.helper.js";

const statementEditorTxt = document.getElementById("statement-editor-txt");
statementEditorTxt.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // with debouncer (500 ms)
statementEditorTxt.addEventListener("change", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // for image preview

document.getElementById("answer-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getAnswerPreview, 500)); // with debouncer (500 ms)

document.getElementById("solution-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getSolutionPreview, 500)); // with debouncer (500 ms)

document.getElementById("exerciseTypeSelect").addEventListener("change", eventHandlers.setDefaultAnswerType);

document.getElementById("toggle-statement-editor-btn").addEventListener("click", eventHandlers.toggleStatementEditor);
document.getElementById("toggle-answer-editor-btn").addEventListener("click", eventHandlers.toggleAnswerEditor);
document.getElementById("toggle-solution-editor-btn").addEventListener("click", eventHandlers.toggleSolutionEditor);

document.getElementById("add-hint-btn").addEventListener("click", eventHandlers.addHintHtmlNode);
document.getElementById("hint-main-div").addEventListener("click", eventHandlers.handleClickForAllHints);
document.getElementById("hint-main-div").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.handleKeyupForAllHints, 500));

const addAnswerOptionBtn = document.getElementById("add-answer-option-btn");
if (addAnswerOptionBtn) addAnswerOptionBtn.addEventListener("click", eventHandlers.addAnswerOptionHtmlNode);

const answerOptionMainDiv = document.getElementById("answer-option-main-div");
if (answerOptionMainDiv) {
    answerOptionMainDiv.addEventListener("click", eventHandlers.handleClickForAllAnswerOptions);
    answerOptionMainDiv.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.handleKeyupForAllAnswerOptions, 500));
}

document.getElementById("gallery-tbl").addEventListener("click", eventHandlers.handleClickInGallery);
// document.querySelectorAll(".delete-file-btn").forEach((item) => item.addEventListener("click", eventHandlers.deleteFile));

/**
 * upload files
 * smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
 * https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
 */

// ! all the code below is ok - commented out temporary.

const uploadFileSelectInput = document.getElementById("upload-file-select-input");

if (uploadFileSelectInput) {
    //const dropArea = document.querySelector(".drop-area"); // find the closest ancestor which matches the selectors
    const galleryTbl = document.getElementById("gallery-tbl");

    const options = {
        uploadFileSelectInput,
        // url: "/fisiere/upload-many",
        url: "/cursuri/63b6ba0c89a768e8c6d6d5e8/exercitii/657caf7734a905f954398e31/upload-files",
        maxFiles: 3,
        maxFileSizeInMB: 1,

        dropArea: document.querySelector(".drop-area"), // find the closest ancestor which matches the selectors
        progressBar: document.querySelector(".progress"),
        uploadFileErrorDiv: document.querySelector(".upload-file-error-div"),
        galleryTbl,
    };

    uploadFilesHelper.uploadFiles(options);
}
