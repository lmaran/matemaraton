import { stringHelper } from "./string.helper.js";
import { constants } from "../constants/constants.js";

export const uploadFilesHelper = {
    uploadFiles: (options) => {
        const {
            uploadFileInput,
            url,
            maxFiles,
            maxFileSizeInMB,
            allowedExtensions,
            dropArea,
            progressBar,
            uploadFileErrorDiv,
            markdownEditorTxt,
            galleryTbl,
            previewFilesFunction,
        } = options;

        uploadFilesHelper.handleBrowse(
            uploadFileInput,
            url,
            maxFiles,
            maxFileSizeInMB,
            allowedExtensions,
            dropArea,
            progressBar,
            uploadFileErrorDiv,
            markdownEditorTxt,
            galleryTbl,
            previewFilesFunction
        );
        uploadFilesHelper.handleDragAndDrop(
            uploadFileInput,
            url,
            maxFiles,
            maxFileSizeInMB,
            allowedExtensions,
            dropArea,
            progressBar,
            uploadFileErrorDiv,
            markdownEditorTxt,
            galleryTbl,
            previewFilesFunction
        );
    },

    handleBrowse: (
        uploadFileInput,
        url,
        maxFiles,
        maxFileSizeInMB,
        allowedExtensions,
        dropArea,
        progressBar,
        uploadFileErrorDiv,
        markdownEditorTxt,
        galleryTbl,
        previewFilesFunction
    ) => {
        uploadFileInput.addEventListener("change", handleInputFiles, false);

        function handleInputFiles() {
            const files = this.files;
            uploadFilesHelper.handleFiles(
                files,
                uploadFileInput,
                url,
                maxFiles,
                maxFileSizeInMB,
                allowedExtensions,
                dropArea,
                progressBar,
                uploadFileErrorDiv,
                markdownEditorTxt,
                galleryTbl,
                previewFilesFunction
            );
        }
    },

    handleDragAndDrop: (
        uploadFileInput,
        url,
        maxFiles,
        maxFileSizeInMB,
        allowedExtensions,
        dropArea,
        progressBar,
        uploadFileErrorDiv,
        markdownEditorTxt,
        galleryTbl,
        previewFilesFunction
    ) => {
        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        ["dragenter", "dragover"].forEach((eventName) => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, unHighlight, false);
        });

        dropArea.addEventListener("drop", handleDrop, false);

        function highlight() {
            dropArea.classList.add("highlight");
        }

        function unHighlight() {
            dropArea.classList.remove("highlight");
        }

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            uploadFilesHelper.handleFiles(
                files,
                uploadFileInput,
                url,
                maxFiles,
                maxFileSizeInMB,
                allowedExtensions,
                dropArea,
                progressBar,
                uploadFileErrorDiv,
                markdownEditorTxt,
                galleryTbl,
                previewFilesFunction
            );
        }
    },

    handleFiles: (
        files,
        uploadFileInput,
        url,
        maxFiles,
        maxFileSizeInMB,
        allowedExtensions,
        dropArea,
        progressBar,
        uploadFileErrorDiv,
        markdownEditorTxt,
        galleryTbl,
        previewFilesFunction
    ) => {
        files = [...files]; // files is not an array, but a FileList. So, we’ll need to convert it to an array.

        const validationFilesMessage = getValidationFilesMessage(files, maxFiles, maxFileSizeInMB, allowedExtensions);
        if (validationFilesMessage) {
            alert(validationFilesMessage);
            uploadFileInput.classList.add("is-invalid");
            uploadFileErrorDiv.innerHTML = validationFilesMessage;
            return false;
        } else {
            uploadFileInput.classList.remove("is-invalid");
        }

        uploadFilesHelper.remoteUploadFiles(files, url, progressBar, markdownEditorTxt, galleryTbl, previewFilesFunction);

        function getValidationFilesMessage(files, maxFiles, maxFileSizeInMB, allowedExtensions) {
            maxFiles = maxFiles || 20;
            maxFileSizeInMB = maxFileSizeInMB || 20;

            if (files.length > maxFiles) return `Poți adăuga maxim ${maxFiles} poze!`;

            let isFileSizeValid = true;
            let isFileExtensionValid = true; // useful for drag & drop
            files.forEach((file) => {
                if (file.size > maxFileSizeInMB * 1024 * 1024) isFileSizeValid = false;

                const fileExtension = stringHelper.getFileExtension(file.name);
                if (!allowedExtensions.includes(fileExtension)) isFileExtensionValid = false;
            });

            if (!isFileSizeValid) return `Un fișier poate avea maxim ${maxFileSizeInMB} MB!`;
            if (!isFileExtensionValid) return `Sunt permise doar fișiere cu extensia ${allowedExtensions.join(", ")}.`;

            return undefined;
        }
    },

    remoteUploadFiles: (files, url, progressBar, markdownEditorTxt, galleryTbl, previewFilesFunction) => {
        const xhr = new XMLHttpRequest(); // with 'XMLHttpRequest' we can track upload progress (we cannot do that with 'fetch')
        xhr.responseType = "json";

        if (progressBar) initializeProgress(files.length);

        xhr.open("POST", url, true);

        if (progressBar)
            xhr.upload.addEventListener("progress", function (e) {
                updateProgress((e.loaded * 100.0) / e.total || 100);
            });

        xhr.addEventListener("readystatechange", function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // uploadFilesHelper.previewFiles(xhr.response);
                previewFilesFunction(xhr.response, markdownEditorTxt, galleryTbl);
            } else if (xhr.readyState == 4 && xhr.status != 200) {
                // Error. Inform the user
            }
        });
        if (progressBar)
            xhr.onload = () => {
                closeProgress(); // on success or error
            };

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("file", file);
        });

        xhr.send(formData);

        function initializeProgress() {
            progressBar.classList.remove("d-none");
            progressBar.value = 0;
        }

        function updateProgress(percent) {
            progressBar.value = percent;
        }

        function closeProgress() {
            progressBar.classList.add("d-none");
        }
    },

    previewFiles: (result, markdownEditorTxt, galleryTbl) => {
        const files = result.files.filter((x) => x.isSuccess);

        files.forEach((file) => {
            const fileExtension = stringHelper.getFileExtension(file.name);

            const isImage = constants.imageExtensions.includes(fileExtension);

            // 1. Add image preview in markdownEditor
            if (markdownEditorTxt) {
                if (markdownEditorTxt.value) markdownEditorTxt.value += "\n\n"; // add the image at the end of the file
                markdownEditorTxt.value += isImage ? `![](${file.url})` : `[${file.name}](${file.url})`;
                markdownEditorTxt.dispatchEvent(new Event("change"));
            }

            // 2. Add image preview in gallery
            if (galleryTbl) {
                const row = galleryTbl.insertRow(-1); // We are adding at the end

                const c1 = row.insertCell(0);

                if (isImage) {
                    const img = document.createElement("img");
                    img.src = file.url;
                    img.height = "50";

                    const a = document.createElement("a");
                    a.title = file.name;
                    a.href = file.url;
                    a.appendChild(img);

                    c1.appendChild(a);
                } else {
                    const img = document.createElement("img");
                    img.src = `/images/${fileExtension}-icon.png`;
                    img.height = "32";
                    c1.appendChild(img);

                    const a = document.createElement("a");
                    a.href = file.url;
                    const linkText = document.createTextNode(file.name);
                    a.appendChild(linkText);

                    c1.appendChild(a);
                }

                const fileIdInput = document.createElement("input");
                fileIdInput.name = "fileIds";
                fileIdInput.classList.add("d-none");
                fileIdInput.value = file.id;
                c1.appendChild(fileIdInput);

                const c2 = row.insertCell(1);

                const deleteLink = document.createElement("a");
                deleteLink.role = "button";
                deleteLink.classList.add("delete-file-btn");
                deleteLink.dataset.fileid = file.id; // same as deleteFileBtn.setAttribute("data-fileid", file.id); // no upperCase
                const deleteLinkText = document.createTextNode("Șterge");
                deleteLink.appendChild(deleteLinkText);

                const detailsLink = document.createElement("a");
                detailsLink.href = file.url;
                const detailsLinkText = document.createTextNode("Detalii");
                detailsLink.appendChild(detailsLinkText);

                const separatorSpan = document.createElement("span");
                separatorSpan.textContent = "|";
                separatorSpan.classList.add("ms-2", "me-2");

                c2.align = "center";
                c2.appendChild(deleteLink);
                c2.appendChild(separatorSpan);
                c2.appendChild(detailsLink);
            }
        });
    },
};
