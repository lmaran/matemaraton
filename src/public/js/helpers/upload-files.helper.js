export const uploadFilesHelper = {
    uploadFiles: (options) => {
        const {
            uploadFileSelectInput,
            url,
            maxFiles,
            maxFileSizeInMB,
            dropArea,
            progressBar,
            uploadFileErrorDiv,
            markdownEditorTxt,
            galleryTbl,
            previewFilesFunction,
        } = options;

        uploadFilesHelper.handleBrowse(
            uploadFileSelectInput,
            url,
            maxFiles,
            maxFileSizeInMB,
            dropArea,
            progressBar,
            uploadFileErrorDiv,
            markdownEditorTxt,
            galleryTbl,
            previewFilesFunction
        );
        uploadFilesHelper.handleDragAndDrop(
            uploadFileSelectInput,
            url,
            maxFiles,
            maxFileSizeInMB,
            dropArea,
            progressBar,
            uploadFileErrorDiv,
            markdownEditorTxt,
            galleryTbl,
            previewFilesFunction
        );
    },

    handleBrowse: (
        uploadFileSelectInput,
        url,
        maxFiles,
        maxFileSizeInMB,
        dropArea,
        progressBar,
        uploadFileErrorDiv,
        markdownEditorTxt,
        galleryTbl,
        previewFilesFunction
    ) => {
        uploadFileSelectInput.addEventListener("change", handleInputFiles, false);

        function handleInputFiles() {
            const files = this.files;
            uploadFilesHelper.handleFiles(
                files,
                uploadFileSelectInput,
                url,
                maxFiles,
                maxFileSizeInMB,
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
        uploadFileSelectInput,
        url,
        maxFiles,
        maxFileSizeInMB,
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
                uploadFileSelectInput,
                url,
                maxFiles,
                maxFileSizeInMB,
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
        uploadFileSelectInput,
        url,
        maxFiles,
        maxFileSizeInMB,
        dropArea,
        progressBar,
        uploadFileErrorDiv,
        markdownEditorTxt,
        galleryTbl,
        previewFilesFunction
    ) => {
        files = [...files]; // files is not an array, but a FileList. So, we’ll need to convert it to an array.

        const validationFilesMessage = getValidationFilesMessage(files, maxFiles, maxFileSizeInMB);
        if (validationFilesMessage) {
            alert(validationFilesMessage);
            uploadFileSelectInput.classList.add("is-invalid");
            uploadFileErrorDiv.innerHTML = validationFilesMessage;
            return false;
        } else {
            uploadFileSelectInput.classList.remove("is-invalid");
        }

        uploadFilesHelper.remoteUploadFiles(files, url, progressBar, markdownEditorTxt, galleryTbl, previewFilesFunction);

        function getValidationFilesMessage(files, maxFiles, maxFileSizeInMB) {
            maxFiles = maxFiles || 20;
            maxFileSizeInMB = maxFileSizeInMB || 20;

            if (files.length > maxFiles) return `Poți adăuga maxim ${maxFiles} poze!`;

            let isFileSizeValid = true;
            //let isFileTypeValid = true; // useful for drag & drop
            files.forEach((file) => {
                if (file.size > maxFileSizeInMB * 1024 * 1024) isFileSizeValid = false;
                //if (!file.type.startsWith("image/")) isFileTypeValid = false;
            });

            if (!isFileSizeValid) return `Un fișier poate avea maxim ${maxFileSizeInMB} MB!`;
            //if (!isFileTypeValid) return "Poți adăuga doar poze ('.jpeg / .png')!";

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
            const imageMimeTypes = ["image/png", "image/svg+xml", "image/jpeg"];
            const isImage = imageMimeTypes.includes(file.mimeType);

            // 1. Add image preview in markdownEditor
            if (markdownEditorTxt) {
                if (markdownEditorTxt.value) markdownEditorTxt.value += "\\\n"; // add the image on a new line
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
                    img.height = "100";

                    c1.appendChild(img);
                } else {
                    // maybe add a thumbnail/icon based on mimeType or file extension

                    const a = document.createElement("a");
                    const linkText = document.createTextNode(file.url);
                    a.appendChild(linkText);
                    a.title = file.name;
                    a.href = file.url;
                    c1.appendChild(a);
                }

                const c2 = row.insertCell(1);

                const fileUrlInput = document.createElement("input");
                fileUrlInput.name = "files";
                fileUrlInput.classList.add("d-none2");
                fileUrlInput.value = file.url;
                c2.appendChild(fileUrlInput);

                // const fileExtensionInput = document.createElement("input");
                // fileExtensionInput.name = "files";
                // fileExtensionInput.classList.add("d-none2");
                // fileExtensionInput.value = file.extension;
                // c2.appendChild(fileExtensionInput);

                const c3 = row.insertCell(2);

                const deleteFileBtn = document.createElement("button");
                deleteFileBtn.textContent = "Șterge";
                deleteFileBtn.type = "button";
                deleteFileBtn.classList.add("btn", "btn-link", "delete-file-btn");
                deleteFileBtn.dataset.url = file.url; // same as deleteFileBtn.setAttribute("data-url", file.url);
                deleteFileBtn.dataset.extension = file.extension;

                c3.appendChild(deleteFileBtn);

                // const fileContainerSpan = document.createElement("span");
                // fileContainerSpan.classList.add("file-container-span");
                // fileContainerSpan.setAttribute("data-url", file.url);

                // const fileParts = file.url.split(".");
                // if (fileParts.length > 0) {
                //     const fileExtension = fileParts[fileParts.length - 1];
                //     if (["jpg", "jpeg", "png", "svg"].includes(fileExtension.toLowerCase())) {
                //         const img = document.createElement("img");
                //         img.src = file.url;
                //         //img.style.height = "100px";
                //         //img.width = "100";
                //         img.height = "100";
                //         fileContainerSpan.appendChild(img);
                //     } else if (fileExtension.toLowerCase() === "pdf") {
                //         // maybe add a pdf thumbnail/icon
                //         const a = document.createElement("a");
                //         const linkText = document.createTextNode(file.url);
                //         a.appendChild(linkText);
                //         a.title = "my title text";
                //         a.href = file.url;
                //         fileContainerSpan.appendChild(a);
                //     } else {
                //         const a = document.createElement("a");
                //         const linkText = document.createTextNode(file.url);
                //         a.appendChild(linkText);
                //         a.title = "my title text";
                //         a.href = file.url;
                //         fileContainerSpan.appendChild(a);
                //     }
                // }

                // gallery.appendChild(fileContainerSpan);

                // const fileContainerInput = document.createElement("input");
                // fileContainerInput.name = "files";
                // fileContainerInput.classList.add("d-none2");
                // fileContainerInput.value = file.url;

                // gallery.appendChild(fileContainerInput);
            }
        });
    },
};
