// const idGeneratorBlobService = require("../services/id-generator-blob.service");
const idGeneratorMongoService = require("../services/id-generator-mongo.service");
// const timeHelper = require("../helpers/date-time.helper");

// https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs#setting-up
// idGeneratorService
//     .init()
//     .then(() => console.log("The initialization of Azure blob is complete!"))
//     .catch(err => {
//         console.error("Error running sample:", err.message);
//     });

exports.getNextId = async (req, res) => {
    try {
        // let start = process.hrtime(); // reset the timer
        // const nextIdWithBlob = await idGeneratorBlobService.getNextId("exercises");
        // console.log(`Returned nextId with Blob in ${timeHelper.elapsedTime(start)} sec.`);

        // start = process.hrtime(); // reset the timer
        const nextId = await idGeneratorMongoService.getNextId("exercises");
        // console.log(`Returned nextId with Mongo in ${timeHelper.elapsedTime(start)} sec.`);

        res.send(nextId);
    } catch (err) {
        res.send(err.message);
    }
};
