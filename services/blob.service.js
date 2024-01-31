const config = require("../config");
const { BlobServiceClient } = require("@azure/storage-blob");
// const streamHelper = require("../helpers/stream.helper");

exports.uploadBlobFromStream = async (containerClient, inputFileStream, blobName, mimeType) => {
    const bufferSize = 4 * 1024 * 1024; // Size of every buffer allocated, also the block size in the uploaded block blob. Default value is 8MB
    const maxConcurrency = 5; // the max number of buffers that can be allocated, positive correlation with max uploading concurrency. Default value is 5

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // UploadStream parameters: https://learn.microsoft.com/en-us/javascript/api/%40azure/storage-blob/blockblobclient?view=azure-node-latest#@azure-storage-blob-blockblobclient-uploadstream
    const blobUploadResponse = await blockBlobClient.uploadStream(inputFileStream, bufferSize, maxConcurrency, {
        blobHTTPHeaders: { blobContentType: mimeType },
    });

    // Response properties: https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobuploadheaders?view=azure-node-latest
    const blobUrl = `${containerClient.url}/${blobName}`;
    return [blobUploadResponse, blobUrl];
};

exports.uploadBlobFromString = async (containerClient, fileContentsAsString, blobName, mimeType) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload parameters:
    // https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobclient?view=azure-node-latest#@azure-storage-blob-blockblobclient-upload
    const blobUploadResponse = await blockBlobClient.upload(fileContentsAsString, fileContentsAsString.length, {
        blobHTTPHeaders: { blobContentType: mimeType },
    });

    // Response properties:
    // https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobuploadheaders?view=azure-node-latest
    const blobUrl = `${containerClient.url}/${blobName}`;
    return [blobUploadResponse, blobUrl];
};

// https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-download-javascript#download-to-a-string
exports.downloadBlobToString = async (containerClient, blobName) => {
    const blobClient = containerClient.getBlobClient(blobName);

    // OK, but old:
    // const downloadResponse = await blobClient.download();
    // const result = await streamHelper.streamToString(downloadResponse.readableStreamBody);

    const result = await blobClient.downloadToBuffer();
    return result.toString();
};

// https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-delete-javascript
exports.deleteBlob = async (containerClient, blobName) => {
    const options = {
        deleteSnapshots: "include",
    };

    const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.delete(options); // we can use 'delete()' or 'deleteIfExists()'
};

// https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-delete-javascript
exports.deleteBlobIfExists = async (containerClient, blobName) => {
    const options = {
        deleteSnapshots: "include",
    };

    const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.deleteIfExists(options); // we can use 'delete()' or 'deleteIfExists()'
};

exports.getBlobProperties = async (containerClient, blobName) => {
    const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.getProperties();
};

// We expose this method for the case we need to create the container outside this file (for caching)
exports.getBlobServiceClient = () => {
    return getBlobServiceClient();
};

// We cannot cache the container here as we can have many kinds of containers (exercise, theory etc)
// So, please don't use this container builder when you know in advance what kind of container do you need (use instead the container created in its specific service, ex: exercise-blob.service.js)
exports.getContainerClient = (containerName) => {
    blobServiceClient = getBlobServiceClient();
    return blobServiceClient.getContainerClient(containerName);
};

let blobServiceClient = null; // reuse this blobServiceClient
const getBlobServiceClient = () => {
    if (!blobServiceClient) {
        blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
    }
    return blobServiceClient;
};
