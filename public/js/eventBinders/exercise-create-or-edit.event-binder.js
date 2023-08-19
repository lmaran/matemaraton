import { eventHandlers } from "../eventHandlers/exercise-create-or-edit.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { uploadFilesHelper } from "../helpers/upload-files.helper.js";

document.getElementById("statement-editor-txt").addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getStatementPreview, 500)); // with debouncer (500 ms)

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

/**
 * upload files
 * smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
 * https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
 */

// ! all the code below is ok - commented out temporary.

const uploadFileSelectInput = document.getElementById("upload-file-select-input");

const options = {
    uploadFileSelectInput,
    url: "/uploadfile",
    maxFiles: 3,
    maxFileSizeInMB: 5,
};

uploadFilesHelper.uploadFiles(options);
