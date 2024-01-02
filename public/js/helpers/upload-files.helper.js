export const uploadFilesHelper = {
    uploadFiles: (options) => {
        const { uploadFileSelectInput, url, maxFiles, maxFileSizeInMB } = options;

        const dropArea = document.querySelector(".drop-area"); // find the closest ancestor which matches the selectors
        const progressBar = document.querySelector(".progress");
        const uploadFileErrorDiv = document.querySelector(".upload-file-error-div");
        const galleryTbl = document.getElementById("gallery-tbl");

        uploadFileSelectInput.addEventListener("change", handleInputFiles, false);

        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ["dragenter", "dragover"].forEach((eventName) => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, unHighlight, false);
        });

        function handleInputFiles() {
            const files = this.files;
            handleFiles(files);
        }

        function highlight() {
            dropArea.classList.add("highlight");
        }

        function unHighlight() {
            dropArea.classList.remove("highlight");
        }

        dropArea.addEventListener("drop", handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            handleFiles(files);
        }

        function handleFiles(files) {
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

            initializeProgress(files.length);

            remoteUploadFiles(files, url);
        }

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

        function remoteUploadFiles(files, url) {
            const xhr = new XMLHttpRequest(); // with 'XMLHttpRequest' we can track upload progress (we cannot do that with 'fetch')
            xhr.responseType = "json";

            xhr.open("POST", url, true);

            xhr.upload.addEventListener("progress", function (e) {
                updateProgress((e.loaded * 100.0) / e.total || 100);
            });

            xhr.addEventListener("readystatechange", function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    previewFiles(xhr.response);
                } else if (xhr.readyState == 4 && xhr.status != 200) {
                    // Error. Inform the user
                }
            });

            xhr.onload = () => {
                closeProgress(); // on success or error
            };

            const formData = new FormData();
            files.forEach((file) => {
                formData.append("file", file);
            });

            xhr.send(formData);
        }

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

        function previewFiles(result) {
            const files = result.files;
            const statementEditorTxt = document.getElementById("statement-editor-txt");
            files.forEach((file) => {
                // Add image preview in markdown
                if (statementEditorTxt.value) statementEditorTxt.value += "\\\n"; // add the image on a new line
                statementEditorTxt.value += `![](${file.url})`;
                statementEditorTxt.dispatchEvent(new Event("change"));

                // we use a file container to add data-attributes on it

                const row = galleryTbl.insertRow(-1); // We are adding at the end

                const c1 = row.insertCell(0);

                const fileParts = file.url.split(".");
                if (fileParts.length > 0) {
                    const fileExtension = fileParts[fileParts.length - 1];
                    if (["jpg", "jpeg", "png", "svg"].includes(fileExtension.toLowerCase())) {
                        const img = document.createElement("img");
                        img.src = file.url;
                        img.height = "100";

                        c1.appendChild(img);
                    } else {
                        // maybe add a pdf thumbnail/icon

                        // if (fileExtension.toLowerCase() === "pdf")

                        const a = document.createElement("a");
                        const linkText = document.createTextNode(file.url);
                        a.appendChild(linkText);
                        a.title = "my title text";
                        a.href = file.url;
                        c1.appendChild(a);
                    }
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
            });
        }
    },
};
