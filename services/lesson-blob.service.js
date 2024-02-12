const blobService = require("./blob.service");
const containerName = "lectii";

exports.uploadBlobFromStream = async (fileContentsAsString, blobName, mimeType = null) => {
    const containerClient = getContainerClient();

    return await blobService.uploadBlobFromString(containerClient, fileContentsAsString, blobName, mimeType);
};

exports.uploadBlobFromString = async (fileContentsAsString, blobName, mimeType) => {
    const containerClient = getContainerClient();

    return await blobService.uploadBlobFromString(containerClient, fileContentsAsString, blobName, mimeType);
};

exports.downloadBlobToString = async (blobName) => {
    const containerClient = getContainerClient();

    return await blobService.downloadBlobToString(containerClient, blobName);
};

exports.deleteBlob = async (blobName) => {
    const containerClient = getContainerClient();

    return await blobService.deleteBlob(containerClient, blobName);
};

exports.deleteBlobIfExists = async (blobName) => {
    const containerClient = getContainerClient();

    return await blobService.deleteBlobIfExists(containerClient, blobName);
};

exports.getBlobProperties = async (blobName) => {
    const containerClient = getContainerClient();

    return await blobService.getBlobProperties(containerClient, blobName);
};

exports.getContainerClient = () => {
    return getContainerClient();
};

exports.getAccountName = () => {
    return blobService.getBlobServiceClient().accountName;
};

let containerClient = null; // reuse this container
const getContainerClient = () => {
    if (!containerClient) {
        const blobServiceClient = blobService.getBlobServiceClient();
        containerClient = blobServiceClient.getContainerClient(containerName);
    }
    return containerClient;
};
