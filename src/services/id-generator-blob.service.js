// NOTE: this service works the same as id-generator-mongo.service but not used anymore due to:
// 1. the mongo based solution is much simpler (no retry needed)
// 2. probably the access to mongo is faster. At least in dev. env.
// 3. the counter is easier to access in mongo (Studio3T vs. Storage Explorer).
// With SE you have to download the file in order to view/edit the content (ST use a hook to re-upload a modified blob)
// If the blob does not have the .txt extensions => lot of warnings for download/edit

// Azure Blobs resources:
// Docs: https://docs.microsoft.com/en-us/javascript/api/@azure/storage-blob/?view=azure-node-latest
// Samples: https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/storage/storage-blob/samples/javascript
// Quick start: https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs

// Azure AutoNumber in C#: https://itnext.io/generate-auto-increment-id-on-azure-62cc962b6fa6
// concurrency with blob and ETag in c#: https://docs.microsoft.com/en-us/azure/storage/common/storage-concurrency

const config = require("../config");
const streamHelper = require("../helpers/stream.helper");
const { BlobServiceClient } = require("@azure/storage-blob");

// run only one time
const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
const containerClient = blobServiceClient.getContainerClient("counters");

let currentId = 0;
let maxId = 0; // exclusive (actually the max id that can be used without a roundtrip to the blob is maxId-1)

exports.getNextId = async (scope) => {
    // in blob se va stoca urmatorul id disponibil
    // ex: pt. un batchSize=3, la primul request in blob se va stoca "3" iar in buffer-ul local vor fi disponibile numele 0,1 si 2
    // clientul va memora două numere:
    // numarul maxim pana la care poate aloca id-uri (exclusiv) (ex: "3")
    // id-ul disponibil pt. urmatoarea cerere (ex: poate stoca 1, 2 sau 3)
    // dupa fiecare cerere, acest id se va incrementa cu 1. Cand se ajunge la nr. maxim, se umple bufferul si se reia procesul

    if (currentId >= maxId) {
        const writeAttempts = 0;
        await this.uploadInMemoryCountersFromBlob(scope, writeAttempts);
    }

    // get from memory
    const nextId = currentId;
    currentId++;

    return `Counter value for  ${scope}: ${nextId}`;
};

exports.uploadInMemoryCountersFromBlob = async (scope, writeAttempts) => {
    try {
        // read the current counter from blob
        const blockBlobClient = containerClient.getBlockBlobClient(`${scope}.txt`);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);

        const originalETag = downloadBlockBlobResponse.originalResponse.etag; // etag: '"0x8D821EA1A932960"',

        const oldValueInBlobAsString = await streamHelper.streamToString(downloadBlockBlobResponse.readableStreamBody);
        const oldValueInBlob = Number(oldValueInBlobAsString);

        // calculate the new counter
        const batchSize = this.getBatchSize(scope, config);
        const newValueInBlob = oldValueInBlob + batchSize;

        // write new counter to the blob

        // only for testing...to have time to change the value manually in Storage Explorer
        // await timeHelper.sleepAsync(20000); // 20 sec

        const data = newValueInBlob.toString();
        await blockBlobClient.upload(data, data.length, {
            conditions: { ifMatch: originalETag },
        });

        // update the "max" and "current" counters in memory
        maxId = newValueInBlob;
        currentId = oldValueInBlob;
    } catch (err) {
        // daca cineva modifica blobul in intervalul de cand citesti pana updatezi => HTTP Status code 412 - precondition failed
        if (err.statusCode === 412) {
            // Retry due to a concurrency conflict
            const maxWriteAttempts = 5;
            if (writeAttempts < maxWriteAttempts) {
                writeAttempts++;
                await this.uploadInMemoryCountersFromBlob(scope, writeAttempts);
            } else {
                console.log("Too much concurrency conflicts!");
                throw new Error("Too much concurrency conflicts!");
            }
        }
    }
};

exports.getBatchSize = (scope, config) => {
    let batchSize = 3; // default
    if (config.idGenerator && config.idGenerator.specificBatchSize && config.idGenerator.specificBatchSize[scope]) {
        batchSize = config.idGenerator.specificBatchSize[scope];
    } else {
        if (config.idGenerator && config.idGenerator.defaultBatchSize) {
            batchSize = config.idGenerator.defaultBatchSize;
        }
    }
    return batchSize;
};
