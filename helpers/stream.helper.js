/**
 * Usage:
 * const content = await streamToBuffer(readableStream);
 * console.log(content);
 * https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/storage/storage-blob/samples/javascript/basic.js
 * Update: we prefer now blobClient.downloadToBuffer();
 */
exports.streamToString = async (readableStream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
};

/**
 *
 * https://2ality.com/2019/11/nodejs-streams-async-iteration.html#collecting-the-contents-of-a-readable-stream-in-a-string
 * Update: we prefer now blobClient.downloadToBuffer();
 */
exports.streamToString_V2 = async (readableStream) => {
    let result = "";
    for await (const chunk of readableStream) {
        result += chunk;
    }
    return result;
};

/**
 * Usage:
 * const content = await streamToBuffer(readableStream);
 * console.log(content.toString());
 * https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-download-javascript#download-to-a-string
 * Update: we prefer now blobClient.downloadToBuffer();
 */
exports.streamToBuffer = async (readableStream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
};
