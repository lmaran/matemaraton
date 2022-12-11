/**
 *
 * A helper method used to read a Node.js readable stream into string
 * https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/storage/storage-blob/samples/javascript/basic.js
 * @param {readableStream} readableStream
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
