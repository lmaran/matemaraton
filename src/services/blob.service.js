const config = require("../config");
const { BlobServiceClient } = require("@azure/storage-blob");

exports.uploadStream = async (containerName, inputFileStream, blobName, mimeType) => {
    const bufferSize = 4 * 1024 * 1024; // Size of every buffer allocated, also the block size in the uploaded block blob. Default value is 8MB
    const maxConcurrency = 5; // the max number of buffers that can be allocated, positive correlation with max uploading concurrency. Default value is 5

    // TODO: send containerClient as a parameter (reuse it)
    // const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
    // const containerClient = blobServiceClient.getContainerClient(containerName);
    //const blobServiceClient = this.getBlobServiceClient();
    const containerClient = this.getContainerClient(containerName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // UploadStream parameters:
    // https://learn.microsoft.com/en-us/javascript/api/%40azure/storage-blob/blockblobclient?view=azure-node-latest#@azure-storage-blob-blockblobclient-uploadstream
    const blobUploadResponse = await blockBlobClient.uploadStream(inputFileStream, bufferSize, maxConcurrency, {
        blobHTTPHeaders: { blobContentType: mimeType },
    });

    // Response properties:
    // https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobuploadheaders?view=azure-node-latest
    const blobUrl = `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`;
    return [blobUploadResponse, blobUrl];
};

// https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-delete-javascript
exports.deleteBlob = async (containerName, blobName) => {
    // include: Delete the base blob and all of its snapshots.
    // only: Delete only the blob's snapshots and not the blob itself.
    const options = {
        deleteSnapshots: "include", // or 'only'
    };

    // TODO: send containerClient as a parameter (reuse it)
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

    const blobDeleteResponse = await blockBlobClient.deleteIfExists(options); // we can use 'delete()' or 'deleteIfExists()'

    return blobDeleteResponse;
};

let blobServiceClient = null;
exports.getBlobServiceClient = () => {
    try {
        if (!blobServiceClient) {
            blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
        }
        return blobServiceClient;
    } catch (error) {
        throw new Error(error);
    }
};

let containerClient = null;
exports.getContainerClient = (containerName) => {
    try {
        if (!containerClient) {
            blobServiceClient = this.getBlobServiceClient();
            containerClient = blobServiceClient.getContainerClient(containerName);
        }
        return containerClient;
    } catch (error) {
        throw new Error(error);
    }
};

let accountName = null;
exports.getAccountName = () => {
    try {
        if (!accountName) {
            accountName = this.getBlobServiceClient().accountName;
        }
        return accountName;
    } catch (error) {
        throw new Error(error);
    }
};

exports.getBlobProperties = async (containerName, blobName) => {
    try {
        const containerClient = this.getContainerClient(containerName);
        const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
        return blockBlobClient.getProperties();
    } catch (error) {
        throw new Error(error);
    }
};
