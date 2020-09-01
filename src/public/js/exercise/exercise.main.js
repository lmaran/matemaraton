import { eventHandlers } from "./exercise.event-handler.js";
import { uploadFilesHelper } from "../helpers/upload-files.helper.js";

/**
 * event binders (alias 'router')
 */

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
const fileSelectInput = document.getElementById("fileSelectInput");
const dropArea = document.getElementById("drop-area");
const progressBar = document.getElementById("progress-bar");
const fileSelectErrorDiv = document.getElementById("fileSelectErrorDiv");
const gallery = document.getElementById("gallery");

const options = {
    fileSelectInput,
    dropArea,
    progressBar,
    fileSelectErrorDiv,
    gallery,
    url: "/uploadfile",
    maxFiles: 3,
    maxFileSizeInMB: 5
};

uploadFilesHelper.uploadFiles(options);
