const autz = require("../services/autz.service");
const exerciseService = require("../services/exercise.service");
const fileService = require("../services/file.service");
const blobService = require("../services/blob.service");

const containerName = "exercises";

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
