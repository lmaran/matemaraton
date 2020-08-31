//const datasourceService = require("../services/datasource.service");
const Busboy = require("busboy");
// const path = require("path");
// const fs = require("fs");
const fileSizeLimit = 100 * 1024 * 1024; // 100 MB

const config = require("../config");
//const streamHelper = require("../helpers/stream.helper");
const stringHelper = require("../helpers/string.helper");
const { BlobServiceClient } = require("@azure/storage-blob");
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

// // run only one time
// const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
// const containerClient = blobServiceClient.getContainerClient("counters");

exports.upload_Old = async (req, res) => {
    // https://stackoverflow.com/a/59295385
    // https://stackoverflow.com/a/29996871/2726725

    // res.send("bbb");

    const startTime = Date.now();
    let batchItems = [];
    const batchSize = 1000; // this is also default batchSize in Mongodb la BulkWrite (internally used by InsertMany)

    //const inputFileNames = [];
    const result = [];
    const result2 = [];
    let files = 0,
        finished = false;

    // I abort upload if file is over 10 MB limit
    const busboy = new Busboy({ headers: req.headers, limits: { fileSize: fileSizeLimit } });
    busboy.on("file", async function(fieldname, uploadFileStream, fileName, encoding, mimeType) {
        result.push({ fileName });
        ++files;
        //validate against empty file name
        if (fileName.length > 0) {
            console.log(
                "File [" +
                    fieldname +
                    "]: filename: " +
                    fileName +
                    ", encoding: " +
                    encoding +
                    ", mimetype: " +
                    mimeType
            );
            // uploadFileStream.on("data", function(data) {
            //     console.log("File [" + fieldname + "] got " + data.length + " bytes");
            // });
            // uploadFileStream.on("end", function() {
            //     console.log("File [" + fieldname + "] Finished");
            // });

            // const filePath = path.join(__dirname, "uploads/" + filename);
            uploadFileStream.on("limit", function() {
                console.log(`file size over ${fileSizeLimit / (1024 * 1024)} MB.`);

                // //delete the file that is large in size
                // fs.unlink(filePath, () => {
                //     console.log("The large file has been deleted.");
                //     // res.writeHead(200, { Connection: "close" });
                //     // res.end("File too large!");
                // });
            });

            // let fstream = fs.createWriteStream(filePath);
            // file.pipe(fstream);

            // fstream.on("close", function() {
            //     console.log("file saved on disk.");
            // });

            // ========================== csv
            //file.pipe(csv()) // csv-parser
            //let rowIdx = 0;
            //file.pipe(csv2.parse({ headers: true, ignoreEmpty: true })) //fast-csv; Any rows consisting of nothing but empty strings and/or commas will be skipped

            // const mongoStream = fastCsv.parseStream(uploadFileStream, { headers: true, ignoreEmpty: true });

            // mongoStream
            //     .on("error", error => console.error(error))
            //     .on("headers", row => {
            //         // console.log(row);
            //     })
            //     .on("data", async row => {
            //         rowIdx++;
            //         //console.log(`${i} ${row._id}`);

            //         // optional, convert
            //         var filtered = {};
            //         Object.keys(row).forEach(function(key) {
            //             if (row[key] === "true" || row[key] === "false") {
            //                 row[key] = row[key] === "true"; // convert to boolean
            //             }
            //             if (row[key] !== "") {
            //                 filtered[key] = row[key]; // remove empty entries
            //             }
            //         });

            //         batchItems.push(filtered);
            //         //insert and reset batch records
            //         if (batchItems.length >= batchSize) {
            //             // https://ninio.ninarski.com/2018/12/10/node-js-streams-and-why-sometimes-they-dont-pause/
            //             mongoStream.pause();
            //             await datasourceService.insertMany(batchItems);
            //             //console.log("saved: " + batchItems.length);
            //             batchItems = []; // reset batch container
            //             mongoStream.resume();
            //         }

            //         //await datasourceService.insertOne(filtered);
            //     })
            //     .on("end", async () => {
            //         if (batchItems.length > 0) await datasourceService.insertMany(batchItems); // left over data
            //         const timeTaken = Date.now() - startTime;
            //         console.log(`Successfully processed ${rowIdx} rows in ${timeTaken / 1000} seconds.`);
            //     });

            const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
            const containerClient = blobServiceClient.getContainerClient("homework-submissions");

            // "Cuş Cuş.jpg" --> "5f4bfb45d8278706d442058c.jpg"
            const blobName = stringHelper.getUniqueFileName(fileName);

            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            try {
                await blockBlobClient.uploadStream(
                    uploadFileStream,
                    uploadOptions.bufferSize,
                    uploadOptions.maxBuffers,
                    { blobHTTPHeaders: { blobContentType: mimeType } }
                );
                //res.render("success", { message: "File uploaded to Azure Blob storage." });
                //console.log(fileName + ": done!");
                const fileInResult = result.find(x => x.fileName === fileName);

                fileInResult.url =
                    "https://" +
                    blobServiceClient.accountName +
                    ".blob.core.windows.net/files/5f4bfb45d8278706d442058c-lg.jpg";
                console.log(fileInResult);
                result2.push(fileInResult);
                console.log(fileName + " aaa");

                // if (--files === 0 && finished) {
                //     res.writeHead(200, { Connection: "close" });
                //     res.end("");
                // }
            } catch (err) {
                //res.render("error", { message: err.message });
            }
        } else {
            console.log("empty file name");
            uploadFileStream.resume();
        }
    });

    busboy.on("finish", function() {
        console.log("Upload completed!");
        console.log(result2);
        res.writeHead(200, { Connection: "close" });
        //res.end("That's all folks!");
        res.end(JSON.stringify(result2));
        //finished = true;
    });

    return req.pipe(busboy);
};

exports.upload = async (req, res) => {
    // https://stackoverflow.com/a/59295385
    // https://stackoverflow.com/a/29996871/2726725

    const result = [];
    //const result2 = [];
    let files = 0,
        finished = false;

    // I abort upload if file is over 10 MB limit
    const busboy = new Busboy({ headers: req.headers, limits: { fileSize: fileSizeLimit } });
    busboy.on("file", async function(fieldname, uploadFileStream, fileName, encoding, mimeType) {
        result.push({ fileName });
        ++files;
        //validate against empty file name
        if (fileName.length > 0) {
            console.log(
                "File [" +
                    fieldname +
                    "]: filename: " +
                    fileName +
                    ", encoding: " +
                    encoding +
                    ", mimetype: " +
                    mimeType
            );
            // uploadFileStream.on("data", function(data) {
            //     console.log("File [" + fieldname + "] got " + data.length + " bytes");
            // });
            // uploadFileStream.on("end", function() {
            //     console.log("File [" + fieldname + "] Finished");
            // });

            // const filePath = path.join(__dirname, "uploads/" + filename);
            uploadFileStream.on("limit", function() {
                console.log(`file size over ${fileSizeLimit / (1024 * 1024)} MB.`);
            });

            const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureBlobStorageConnectionString);
            const containerClient = blobServiceClient.getContainerClient("files");

            // "Cuş Cuş.jpg" --> "5f4bfb45d8278706d442058c.jpg"
            const blobName = stringHelper.getUniqueFileName(fileName);

            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            try {
                await blockBlobClient.uploadStream(
                    uploadFileStream,
                    uploadOptions.bufferSize,
                    uploadOptions.maxBuffers,
                    { blobHTTPHeaders: { blobContentType: mimeType } }
                );
                //res.render("success", { message: "File uploaded to Azure Blob storage." });
                //console.log(fileName + ": done!");
                const fileInResult = result.find(x => x.fileName === fileName);

                fileInResult.url =
                    "https://" + blobServiceClient.accountName + ".blob.core.windows.net/files/" + blobName;
                //console.log(fileInResult);
                //result.push(fileInResult);
                //console.log(fileName + " aaa");

                if (--files === 0 && finished) {
                    //res.writeHead(200, { Connection: "close" });
                    console.log("Upload completed and saved to Blob!");
                    console.log(result);
                    //res.end(JSON.stringify(result));
                    res.json(result);
                    //res.end("");
                }
            } catch (err) {
                //res.render("error", { message: err.message });
            }
        } else {
            console.log("empty file name");
            uploadFileStream.resume();
        }
    });

    busboy.on("finish", function() {
        console.log("Upload completed!");
        finished = true;
    });

    return req.pipe(busboy);
};
