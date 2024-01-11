const fileService = require("../services/file.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.getOneById = async (req, res) => {
    const { fileId } = req.params;

    try {
        // validate parameters
        const file = await fileService.getOneById(fileId);
        if (!file) return res.status(500).send("Fișier negăsit!");

        //let pageTitle = availableSheetTypes[sheet.sheetType - 1].text;

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

        files.forEach((file) => (file.createdOn = dateTimeHelper.getShortDateAndTimeDateRo(file.createdOn))); // ex: 22.11.2023

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
