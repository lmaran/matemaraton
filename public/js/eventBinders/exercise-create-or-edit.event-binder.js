import { eventHandlers } from "../eventHandlers/exercise-create-or-edit.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { uploadFilesHelper } from "../helpers/upload-files.helper.js";

const statementEditorTxt = document.getElementById("statement-editor-txt");
statementEditorTxt.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // with debouncer (500 ms)
statementEditorTxt.addEventListener("change", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // for image preview

document.getElementById("answer-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getAnswerPreview, 500)); // with debouncer (500 ms)

const solutionEditorTxt = document.getElementById("solution-editor-txt");
solutionEditorTxt.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getSolutionPreview, 500)); // with debouncer (500 ms)
solutionEditorTxt.addEventListener("change", dateTimeHelper.debounce(eventHandlers.getSolutionPreview, 500)); // for image preview

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

const courseId = document.getElementById("courseId").value;
const exerciseId = document.getElementById("exerciseId").value; // empty in edit mode
const url = exerciseId ? `/cursuri/${courseId}/exercitii/${exerciseId}/upload-files` : `/cursuri/${courseId}/exercitii/upload-files`;

const allowedExtensions = ["png", "svg", "jpeg", "jpg", "pdf"];

const uploadFileStatementInput = document.getElementById("upload-file-statement-input");
if (uploadFileStatementInput) {
    const options = {
        uploadFileInput: uploadFileStatementInput,
        url,

        maxFiles: 3,
        maxFileSizeInMB: 1,
        allowedExtensions,

        dropArea: statementEditorTxt,
        progressBar: document.getElementById("upload-file-progress-statement-div"), // let it undefined if you don't need preview in markdownEditor
        uploadFileErrorDiv: document.getElementById("upload-file-error-statement-div"),

        markdownEditorTxt: statementEditorTxt, // let it undefined if you don't need preview in markdownEditor
        galleryTbl: document.getElementById("gallery-tbl"), // let it undefined if you don't need preview in gallery
        previewFilesFunction: uploadFilesHelper.previewFiles,
    };

    uploadFilesHelper.uploadFiles(options);
}

const uploadFileSolutionInput = document.getElementById("upload-file-solution-input");
if (uploadFileSolutionInput) {
    const options = {
        uploadFileInput: uploadFileSolutionInput,
        url,

        maxFiles: 3,
        maxFileSizeInMB: 1,
        allowedExtensions,

        dropArea: solutionEditorTxt,
        progressBar: document.getElementById("upload-file-progress-solution-div"), // let it undefined if you don't need preview in markdownEditor
        uploadFileErrorDiv: document.getElementById("upload-file-error-solution-div"),

        markdownEditorTxt: solutionEditorTxt, // let it undefined if you don't need preview in markdownEditor
        galleryTbl: document.getElementById("gallery-tbl"), // let it undefined if you don't need preview in gallery
        previewFilesFunction: uploadFilesHelper.previewFiles,
    };

    uploadFilesHelper.uploadFiles(options);
}
