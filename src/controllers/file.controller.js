const fileService = require("../services/file.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const prettyJsonHelper = require("../helpers/pretty-json.helper");
const stringHelper = require("../helpers/string.helper");
const blobService = require("../services/blob.service");

const { imageExtensions } = require("../constants/constants");

exports.getOneById = async (req, res) => {
    const { fileId } = req.params;

    try {
        // validate parameters
        const file = await fileService.getOneById(fileId);
        if (!file) return res.status(500).send("Fișier negăsit!");

        // file.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(file.createdOn); // ex: 22.11.2023
        const fileExtension = stringHelper.getFileExtension(file.name);
        file.extension = fileExtension;
        file.isImage = imageExtensions.includes(fileExtension);

        const data = {
            file,
            // pageTitle,
        };

        res.render("file/file", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
    try {
        const files = await fileService.getAll();

        files.forEach((file) => {
            file.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(file.createdOn); // ex: 22.11.2023
            const fileExtension = stringHelper.getFileExtension(file.name);
            file.extension = fileExtension;
            file.isImage = imageExtensions.includes(fileExtension);
        });

        const data = {
            files,
        };

        //res.send(data);
        res.render("file/files", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.jsonGetOneById = async (req, res) => {
    const { fileId } = req.params;
    try {
        // validate parameters
        const sheet = await fileService.getOneById(fileId);
        if (!sheet) return res.status(500).send("Fișă negăsită!");

        const prettyJson = prettyJsonHelper.getPrettyJson(sheet);

        const data = {
            fileId,
            prettyJson,
        };

        // TODO: fix it
        data.canCreateOrEditSheet = true;

        //res.send(data);
        res.render("file/file-json", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.deleteOneById = async (req, res) => {
    const { fileId } = req.params;

    try {
        const fileFromDB = await fileService.getOneById(fileId);
        if (!fileFromDB) return res.status(404).json({ code: "not-found", message: "Fișier negăsit" });

        // Delete from Azure blobs
        const fileExtension = stringHelper.getFileExtension(fileFromDB.name);
        const blobName = `${fileFromDB._id.toString()}.${fileExtension}`;
        await blobService.deleteBlob(fileFromDB.containerName, blobName);

        // Delete also from Files
        await fileService.deleteOneById(fileId);

        res.sendStatus(204); // no content
    } catch (err) {
        return res.status(500).json({ code: "exception", message: err.message });
    }
};
