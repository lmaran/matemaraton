export const uploadFilesHelper = {
    uploadFiles: options => {
        const {
            fileSelectInput,
            dropArea,
            progressBar,
            fileSelectErrorDiv,
            gallery,
            url,
            maxFiles,
            maxFileSizeInMB
        } = options;

        fileSelectInput.addEventListener("change", handleFiles, false);

        ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ["dragenter", "dragover"].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            dropArea.addEventListener(eventName, unHighlight, false);
        });

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
            const fileSelectInput = document.getElementById("fileSelectInput");
            if (validationFilesMessage) {
                fileSelectInput.classList.add("is-invalid");
                fileSelectErrorDiv.innerHTML = validationFilesMessage;
                return false;
            } else {
                fileSelectInput.classList.remove("is-invalid");
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
            files.forEach(file => {
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

            xhr.upload.addEventListener("progress", function(e) {
                updateProgress((e.loaded * 100.0) / e.total || 100);
            });

            xhr.addEventListener("readystatechange", function(e) {
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
            files.forEach(file => {
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

        function previewFiles(files) {
            files.forEach(file => {
                const fileParts = file.url.split(".");
                if (fileParts.length > 0) {
                    const fileExtension = fileParts[fileParts.length - 1];
                    if (["jpg", "jpeg", "png"].includes(fileExtension.toLowerCase())) {
                        const img = document.createElement("img");
                        img.src = file.url;
                        gallery.appendChild(img);
                    } else if (fileExtension.toLowerCase() === "pdf") {
                        const a = document.createElement("a");
                        const linkText = document.createTextNode(file.url);
                        a.appendChild(linkText);
                        a.title = "my title text";
                        a.href = file.url;
                        gallery.appendChild(a);
                    }
                }
            });
        }
    }
};
