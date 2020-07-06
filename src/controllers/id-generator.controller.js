const idGeneratorService = require("../services/id-generator.service");

// https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs#setting-up
// idGeneratorService
//     .init()
//     .then(() => console.log("The initialization of Azure blob is complete!"))
//     .catch(err => {
//         console.error("Error running sample:", err.message);
//     });

exports.getNextId = async (req, res) => {
    try {
        const startTime = Date.now();
        const nextId = await idGeneratorService.getNextId("exercises");
        const timeTaken = Date.now() - startTime;
        console.log(`Returned nextId in ${timeTaken / 1000} sec.`); // ~ 0.1 sec on dev machine (via Azure)
        res.send(nextId);
    } catch (err) {
        res.send(err.message);
    }
};
