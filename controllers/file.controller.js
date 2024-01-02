const busboy = require("busboy");
const stringHelper = require("../helpers/string.helper");
const autz = require("../services/autz.service");
const exerciseService = require("../services/exercise.service");
const fileService = require("../services/file.service");
const blobService = require("../services/blob.service");

const containerName = "exercises";

// Output
// HTTP/1.1  200
// Content-Type: application/json
// {
//     "statusCode":"too-many-files", // fișierele care depășesc limita nu apar în listă
//     "statusMessage": "Sunt permise maxim 3 fișiere",
//     "files": [{
//          "name": "matemaraton-logo-square.png",
//          "mimeType": "image/png",
//          "isSuccess": true,
//          "size": 5228,
//          "id": "6592dab4864b7d67daa4f021",
//          "url": "https://matemaratondev.blob.core.windows.net/exercises/6592dab4864b7d67daa4f021.png"
//      }, {
//          "name": "image2.png",
//          "mimeType": "application/octet-stream",
//          "isSuccess": false,
//          "statusCode": "unknown-mime-type",
//          "statusMessage": "Sunt permise doar fișiere de tip image/png, image/svg+xml"
//      }, {
//          "name": "image3.png",
//          "mimeType": "image/png",
//          "isSuccess": false,
//          "statusCode": "size-too-large",
//          "statusMessage": "Sunt permise doar fișiere mai mici de xMB"
//      }]
// }

// HTTP/1.1  403
// Content-Type: application/json
// {
//      code: "forbidden",
//      message: "Lipsă permisiuni."
// }

exports.uploadMany = async (req, res) => {
    // Called once, no matter haw many files there are
    // https://stackoverflow.com/a/29996871/2726725

    const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
    if (!canCreateOrEditExercise) {
        return res.status(403).json({ code: "forbidden", message: "Lipsă permisiuni." });
    }

    const maxFileSize = 1 * 1024 * 1024; // 1 MB
    const maxFiles = 3;
    const allowedMimeType = ["image/png", "image/svg+xml", "image/jpeg"];
    const result = { files: [] };
    let finished = false;

    try {
        const bb = busboy({ headers: req.headers, limits: { fileSize: maxFileSize, files: maxFiles } });

        bb.on("file", async (fieldName, fileStream, info) => {
            // Called multiple times, one for each file
            const { filename, mimeType } = info;

            const file = { name: filename, mimeType, statusCode: "inProgress" };
            result.files.push(file);

            if (!allowedMimeType.includes(mimeType)) {
                file.isSuccess = false;
                file.statusCode = "unknown-mime-type";
                file.statusMessage = `Sunt permise doar fișiere de tip ${allowedMimeType.toString()}.`;

                fileStream.resume(); // we should always consume the stream whether we care about its contents or not, otherwise the 'finish'/'close' event will never fire

                return; // exit the loop and go to the next file
            }

            const fileObjectId = fileService.getObjectId();
            const fileId = fileObjectId.toString(); // "5f4bfb45d8278706d442058c"
            const fileExtension = stringHelper.getFileExtension(filename); // "jpg"
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

                    // Save to DB.
                    const fileToDb = {
                        _id: fileObjectId,
                        name: file.name,
                        mimeType: file.mimeType,
                        extension: fileExtension,
                        url: file.url,
                        size: file.size,
                        accountName: blobService.getAccountName(),
                        containerName: containerName,
                        createdOn: new Date(),
                        createdBy: { id: req.user._id.toString(), name: `${req.user.firstName} ${req.user.lastName}` },
                    };
                    await fileService.insertOne(fileToDb); // TODO: maybe we can save all files at once with 'insertMany'
                }
            }

            // The last file has been saved and we don't expect other files to come.
            if (result.files.filter((x) => x.statusCode === "inProgress").length === 0 && finished) {
                return res.json(result);
            }
        });

        bb.on("filesLimit", () => {
            // If maxFiles = 3 and we try to upload 5 files, the first 3 files will be uploaded, but not the others. Fired before 'close'.
            result.statusCode = "too-many-files";
            result.statusMessage = `Sunt permise maxim ${maxFiles} fișiere.`;
        });

        bb.on("close", () => {
            // Fired once the entire request has been fully processed, including files, but before the files are uploaded
            finished = true;

            if (result.files.filter((x) => x.statusCode === "inProgress").length === 0) {
                // Usually this code is reached if we don't have anything to save (we have only files with "unknown-mime-type").
                // Much less often, but it can also happen if the previous files were already saved to blobs.
                return res.json(result);
            }
        });

        // Redirect the incoming HTTP request stream to the busboy library
        req.pipe(bb);
        return;
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
    }
};

// Output
// HTTP/1.1  200
// Content-Type: application/json
// {
//     "statusCode":"too-many-files", // fișierele care depășesc limita nu apar în listă
//     "statusMessage": "Sunt permise maxim 3 fișiere",
//     "file": {
//          "name": "matemaraton-logo-square.png",
//          "mimeType": "image/png",
//          "isSuccess": true,
//          "size": 5228,
//          "id": "6592dab4864b7d67daa4f021",
//          "url": "https://matemaratondev.blob.core.windows.net/exercises/6592dab4864b7d67daa4f021.png"
//      }
// }
//
//  Other status for a file:
//      {
//          "name": "image2.png",
//          "mimeType": "application/octet-stream",
//          "isSuccess": false,
//          "statusCode": "unknown-mime-type",
//          "statusMessage": "Sunt permise doar fișiere de tip image/png, image/svg+xml"
//      }, {
//          "name": "image3.png",
//          "mimeType": "image/png",
//          "isSuccess": false,
//          "statusCode": "size-too-large",
//          "statusMessage": "Sunt permise doar fișiere mai mici de xMB"
//      }

// HTTP/1.1  403
// Content-Type: application/json
// {
//      code: "forbidden",
//      message: "Lipsă permisiuni."
// }

// A simplified version of uploadMany
exports.uploadOne = async (req, res) => {
    const canCreateOrEditExercise = await autz.can(req.user, "create-or-edit:exercise");
    if (!canCreateOrEditExercise) {
        return res.status(403).json({ code: "forbidden", message: "Lipsă permisiuni." });
    }

    const maxFileSize = 1 * 1024 * 1024; // 1 MB
    const maxFiles = 1;
    const allowedMimeType = ["image/png", "image/svg+xml", "image/jpeg"];
    const result = { file: {} };

    try {
        const bb = busboy({ headers: req.headers, limits: { fileSize: maxFileSize, files: maxFiles } });

        bb.on("file", async (fieldName, fileStream, info) => {
            const { filename, mimeType } = info;

            const file = { name: filename, mimeType };
            result.file = file;

            if (!allowedMimeType.includes(mimeType)) {
                file.isSuccess = false;
                file.statusCode = "unknown-mime-type";
                file.statusMessage = `Sunt permise doar fișiere de tip ${allowedMimeType.toString()}.`;

                return res.json(result);
            }

            const fileObjectId = fileService.getObjectId();
            const fileId = fileObjectId.toString(); // "5f4bfb45d8278706d442058c"
            const fileExtension = stringHelper.getFileExtension(filename); // "jpg"
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

                    // Save to DB.
                    const fileToDb = {
                        _id: fileObjectId,
                        name: file.name,
                        mimeType: file.mimeType,
                        extension: fileExtension,
                        url: file.url,
                        size: file.size,
                        accountName: blobService.getAccountName(),
                        containerName: containerName,
                        createdOn: new Date(),
                        createdBy: { id: req.user._id.toString(), name: `${req.user.firstName} ${req.user.lastName}` },
                    };
                    await fileService.insertOne(fileToDb); // TODO: maybe we can save all files at once with 'insertMany'
                }
            }

            return res.json(result);
        });

        bb.on("filesLimit", () => {
            // If maxFiles = 3 and we try to upload 5 files, the first 3 files will be uploaded, but not the others. Fired before 'close'.
            result.statusCode = "too-many-files";
            result.statusMessage = `Sunt permise maxim ${maxFiles} fișiere.`;
        });

        // Redirect the incoming HTTP request stream to the busboy library
        req.pipe(bb);
        return;
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
    }
};

exports.deleteOneById = async (req, res) => {
    const { fileId } = req.params;
    const { exerciseId, extension } = req.query;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).json({ code: "forbidden", message: "Lipsă permisiuni." });
        }

        // const course = await courseService.getOneById(courseId);
        // if (!course) return res.status(500).send("Curs negăsit!");

        // const { exerciseMeta: exercise } = exerciseHelper.getExerciseAndParentsFromCourse(course, exerciseId);
        // if (!exercise) return res.status(500).send("Exercițiu negăsit!");

        const exercise = await exerciseService.getOneById(exerciseId);
        if (!exercise) return res.status(404).send("Exercițiu negăsit.");

        // const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
        // const url = "https://" + blobServiceClient.accountName + ".blob.core.windows.net/exercises/" + fileId;
        const fileIndex = (exercise.files || []).findIndex((x) => x.url.includes(fileId));

        if (fileIndex > -1) {
            exercise.files.splice(fileIndex, 1); // remove from array

            // Delete from Azure blobs
            const blobName = `${fileId}.${extension || "png"}`;
            const blobDeleteResponse = await blobService.deleteBlob(containerName, blobName);

            if (blobDeleteResponse.errorCode && blobDeleteResponse.errorCode !== "BlobNotFound") {
                return res.status(500).json("Eroare la ștergerea blob-ului.");
            }

            // Delete from exercise
            exerciseService.updateOne(exercise);

            // Delete from files
            fileService.deleteOneById(fileId);
        }

        // res.redirect(`/cursuri/${courseId}/capitole/${chapter.id}/modifica`);
        // res.sendStatus(204); // no content
        return res.json(exercise.files);
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
    }
};
