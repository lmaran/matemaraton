const idGeneratorService = require("../services/id-generator.service");
const timeHelper = require("../helpers/date-time.helper");

// https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs#setting-up
// idGeneratorService
//     .init()
//     .then(() => console.log("The initialization of Azure blob is complete!"))
//     .catch(err => {
//         console.error("Error running sample:", err.message);
//     });

exports.getNextId = async (req, res) => {
    try {
        const start = process.hrtime();

        const nextId = await idGeneratorService.getNextId("exercises");

        console.log(`Returned nextId in ${timeHelper.elapsedTime(start)} sec.`);

        res.send(nextId);
    } catch (err) {
        res.send(err.message);
    }
};
