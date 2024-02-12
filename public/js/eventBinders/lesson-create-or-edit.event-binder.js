import { commonEventHandler } from "../eventHandlers/lesson.common-event-handler.js";
import { eventHandlers } from "../eventHandlers/lesson-create-or-edit.event-handler.js";
import { dateTimeHelper } from "../helpers/date-time.helper.js";
import { uploadFilesHelper } from "../helpers/upload-files.helper.js";

document.getElementById("toggle-theory-editor-btn")?.addEventListener("click", eventHandlers.toggleTheoryEditor);
const theoryEditorTxt = document.getElementById("theory-editor-txt");
theoryEditorTxt?.addEventListener("keyup", dateTimeHelper.debounce(eventHandlers.getTheoryPreview, 500)); // with debouncer (500 ms)
theoryEditorTxt?.addEventListener("change", dateTimeHelper.debounce(eventHandlers.getTheoryPreview, 500)); // for image preview

// common
document.querySelectorAll(".toggle-answer-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleAnswer));
document.querySelectorAll(".toggle-hints-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleHints));
document.querySelectorAll(".show-next-hint-btn").forEach((item) => item.addEventListener("click", commonEventHandler.showNextHint));
document.querySelectorAll(".toggle-solution-btn").forEach((item) => item.addEventListener("click", commonEventHandler.toggleSolution));

document.getElementById("gallery-tbl")?.addEventListener("click", eventHandlers.handleClickInGallery);

/**
 * upload files
 * smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
 * https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
 */

const lessonId = document.getElementById("lessonId")?.value; // empty in edit mode
const url = lessonId ? `/lectii/${lessonId}/upload-files` : `/lectii/upload-files`;

const allowedExtensions = ["png", "svg", "jpeg", "jpg", "pdf"];

const uploadFileTheoryInput = document.getElementById("upload-file-theory-input");
if (uploadFileTheoryInput && lessonId) {
    const options = {
        uploadFileInput: uploadFileTheoryInput,
        url,

        maxFiles: 3,
        maxFileSizeInMB: 1,
        allowedExtensions,

        dropArea: theoryEditorTxt,
        progressBar: document.getElementById("upload-file-progress-theory-div"), // let it undefined if you don't need preview in markdownEditor
        uploadFileErrorDiv: document.getElementById("upload-file-error-theory-div"),

        markdownEditorTxt: theoryEditorTxt, // let it undefined if you don't need preview in markdownEditor
        galleryTbl: document.getElementById("gallery-tbl"), // let it undefined if you don't need preview in gallery
        previewFilesFunction: uploadFilesHelper.previewFiles,
    };

    uploadFilesHelper.uploadFiles(options);
}
