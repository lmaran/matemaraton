// Azure Blobs resources:
// Docs: https://docs.microsoft.com/en-us/javascript/api/@azure/storage-blob/?view=azure-node-latest
// Samples: https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/storage/storage-blob/samples/javascript
// Quick start: https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs

const config = require("../config");
const { BlobServiceClient } = require("@azure/storage-blob");

const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);

// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient("counters");

exports.init = async () => {
    // const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
    // // Get a reference to a container
    // const containerClient = blobServiceClient.getContainerClient("counters");
    // Upload blob to a container
    // const blobName = "exercises.txt";
    // const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    // // Upload data to the blob
    // const data = "Hello, World!";
    // const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    // console.log(uploadBlobResponse);
};

let currentId = 0;
let maxId = 0;

exports.getNextId = async scope => {
    // in blob se va stoca urmatorul id disponibil
    // ex: pt. un batchSize=3, la primul request in blob se va stoca "3" iar in buffer-ul local vor fi disponibile numele 0,1 si 2
    // clientul va memora două numere:
    // numarul maxim pana la care poate aloca id-uri (exclusiv) (ex: "3")
    // id-ul disponibil pt. urmatoarea cerere (ex: poate stoca 1, 2 sau 3)
    // dupa fiecare cerere, acest id se va incrementa cu 1. Cand se ajunge la nr. maxim, se umple bufferul si se reia procesul

    if (currentId === maxId) {
        const writeAttempts = 0;
        await uploadInMemoryCountersFromBlob(scope, writeAttempts);
    }

    // get from memory
    const nextId = currentId;
    currentId++;

    return `Counter value for  ${scope}: ${nextId}`;
};

// async function uploadBlobAsync(blockBlobClient, data, originalETag) {
async function uploadInMemoryCountersFromBlob(scope, writeAttempts) {
    try {
        // read the current counter from blob

        const blockBlobClient = containerClient.getBlockBlobClient(`${scope}.txt`);

        const downloadBlockBlobResponse = await blockBlobClient.download(0);

        const originalETag = downloadBlockBlobResponse.originalResponse.etag; // etag: '"0x8D821EA1A932960"',
        //const originalETag = "wrong-etag";

        const oldValueInBlobAsString = await streamToString(downloadBlockBlobResponse.readableStreamBody);

        const oldValueInBlob = Number(oldValueInBlobAsString);

        // calculate the new counter
        const batchSize = 3;
        const newValueInBlob = oldValueInBlob + batchSize;

        // write new counter to the blob

        // only for testing...to have time to change the value manually in Storage Explorer
        //await sleepAsync(20000); // 20 sec

        const data = newValueInBlob.toString();

        await blockBlobClient.upload(data, data.length, { conditions: { ifMatch: originalETag } });
        // update the "max" and "current" counters in memory
        maxId = newValueInBlob;
        currentId = oldValueInBlob;
    } catch (err) {
        /// daca cineva modifica blobul in intervalul de cand citesti pana updatezi => HTTP Status code 412 - precondition failed
        if (err.statusCode === 412) {
            console.log("Retry due to a concurrency conflict");

            const maxWriteAttempts = 5;
            if (writeAttempts < maxWriteAttempts) {
                // retry
                writeAttempts++;
                await uploadInMemoryCountersFromBlob(scope, writeAttempts);
            } else {
                console.log("Too much concurrency conflicts!");
                throw new Error("Too much concurrency conflicts!");
            }
        }
    }
}

// A helper method used to read a Node.js readable stream into string
// https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/storage/storage-blob/samples/javascript/basic.js
// TODO: move it into the helper folders if we need it multiple places
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", data => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}

// only for testing (sleep and block the thread)
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

// only for testing (sleep but does not block the thread)
function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
