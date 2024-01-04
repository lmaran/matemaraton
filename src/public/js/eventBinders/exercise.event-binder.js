import { eventHandlers } from "../eventHandlers/exercise.event-handler.js";
import { uploadFilesHelper } from "../helpers/upload-files.helper.js";

const toggleAnswerBtn = document.getElementById("toggle-answer-btn");
if (toggleAnswerBtn) toggleAnswerBtn.addEventListener("click", eventHandlers.toggleAnswer);

const toggleHintsBtn = document.getElementById("toggle-hints-btn");
if (toggleHintsBtn) toggleHintsBtn.addEventListener("click", eventHandlers.toggleHints);

const toggleSolutionBtn = document.getElementById("toggle-solution-btn");
if (toggleSolutionBtn) toggleSolutionBtn.addEventListener("click", eventHandlers.toggleSolution);

const showNextHintBtn = document.getElementById("show-next-hint-btn");
if (showNextHintBtn) showNextHintBtn.addEventListener("click", eventHandlers.showNextHint);

/**
 * upload files
 * smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
 * https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
 */

// ! all the code below is ok - commented out temporary.

const uploadFileSelectInput = document.getElementById("upload-file-select-input");

const options = {
    uploadFileSelectInput,
    url: "/fisiere/upload-files",
    maxFiles: 3,
    maxFileSizeInMB: 1,
};

uploadFilesHelper.uploadFiles(options);

const mySolutionSubmitBtn = document.getElementById("my-solution-submit-btn");
if (mySolutionSubmitBtn) mySolutionSubmitBtn.addEventListener("click", eventHandlers.submitMySolution);
