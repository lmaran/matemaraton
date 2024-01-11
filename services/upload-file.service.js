const busboy = require("busboy");
const stringHelper = require("../helpers/string.helper");
const fileService = require("./file.service");
const blobService = require("./blob.service");

// Output
// {
//     "statusCode":"too-many-files", // fișierele care depășesc limita nu apar în listă
//     "statusMessage": "Sunt permise maxim 3 fișiere",
//     "files": [{
//          "name": "matemaraton-logo-square.png",
//          "isSuccess": true,
//          "size": 5228,
//          "id": "6592dab4864b7d67daa4f021",
//          "url": "https://matemaratondev.blob.core.windows.net/exercises/6592dab4864b7d67daa4f021.png"
//      }, {
//          "name": "image2.png",
//          "isSuccess": false,
//          "statusCode": "unknown-file-extension",
//          "statusMessage": "Sunt permise doar fișiere cu extensia png, svg, jpeg, jpg, pdf"
//      }, {
//          "name": "image3.png",
//          "isSuccess": false,
//          "statusCode": "size-too-large",
//          "statusMessage": "Sunt permise doar fișiere mai mici de xMB"
//      }]
// }
exports.uploadFiles = async (req, emitter, params) => {
    // Called once, no matter haw many files there are
    // https://stackoverflow.com/a/29996871/2726725

    const { maxFileSize, maxFiles, allowedExtensions, containerName } = params;
    const result = { files: [] };
    let finished = false;

    const bb = busboy({ headers: req.headers, limits: { fileSize: maxFileSize, files: maxFiles } });

    bb.on("file", async (fieldName, fileStream, info) => {
        // Called multiple times, once for each file
        const { filename, mimeType } = info;

        const file = { name: filename, statusCode: "inProgress" };
        result.files.push(file);

        const fileExtension = stringHelper.getFileExtension(filename); // "jpg"

        if (!allowedExtensions.includes(fileExtension)) {
            file.isSuccess = false;
            file.statusCode = "unknown-file-extension";
            file.statusMessage = `Sunt permise doar fișiere cu extensia ${allowedExtensions.join(", ")}.`;

            fileStream.resume(); // we should always consume the stream whether we care about its contents or not, otherwise the 'finish'/'close' event will never fire

            return; // exit the loop and go to the next file
        }

        const fileObjectId = fileService.getObjectId();
        const fileId = fileObjectId.toString(); // "5f4bfb45d8278706d442058c"
        const blobName = `${fileId}.${fileExtension}`; // "5f4bfb45d8278706d442058c.jpg"

        const [blobUploadResponse, blobUrl] = await blobService.uploadStream(containerName, fileStream, blobName, mimeType);

        const blobProperties = await blobService.getBlobProperties(containerName, blobName); // get file size

        if (blobUploadResponse.errorCode) {
            file.isSuccess = false;
            file.statusCode = "error-on-save-to-blob";
            file.statusMessage = `A apărut o eroare la salvarea fișierului în blob. Cod eroare: ${blobUploadResponse.errorCode}.`;
        } else {
            if (fileStream.truncated) {
                file.isSuccess = false;
                file.statusCode = "size-too-large";
                file.statusMessage = `Sunt permise doar fișiere mai mici de ${maxFileSize / (1024 * 1024)}MB.`;

                // Remove truncated files from blobs (fire and forget)
                blobService.deleteBlob(containerName, blobName);
            } else {
                file.isSuccess = true;
                file.url = blobUrl;
                file.id = fileId;
                file.size = blobProperties.contentLength;

                delete file.statusCode;
            }
        }

        // The last file has been saved and we don't expect other files to come.
        if (result.files.filter((x) => x.statusCode === "inProgress").length === 0 && finished) {
            emitter.emit("uploaded", result);
        }
    });

    bb.on("filesLimit", () => {
        // If uploadedFiles > maxFiles, the first [maxFiles] files will be uploaded, but not the others. Fired before 'close'.
        result.statusCode = "too-many-files";
        result.statusMessage = `Sunt permise maxim ${maxFiles} fișiere.`;
    });

    bb.on("close", () => {
        // Fired once the entire request has been fully processed, including files, but before the files are uploaded
        finished = true;

        if (result.files.filter((x) => x.statusCode === "inProgress").length === 0) {
            // Usually this code is reached if we don't have anything to save (we have only files with "unknown-file-extension").
            // Much less often, but it can also happen if the previous files were already saved to blobs.
            emitter.emit("uploaded", result);
        }
    });

    req.pipe(bb); // redirect the incoming HTTP request stream to the busboy library
    return; // remove this this call procedure from stack
};
