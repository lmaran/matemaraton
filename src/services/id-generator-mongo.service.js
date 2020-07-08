// https://www.mongodb.com/blog/post/generating-globally-unique-identifiers-for-use-with-mongodb
// red the notes on id-generator-blob.service file to see why I chose mongo over blob for this solution

const config = require("../config");
const mongoHelper = require("../helpers/mongo.helper");

let currentId = 0;
let maxId = 0; // exclusive (actually the max id that can be used without a roundtrip to the blob is maxId-1)

exports.getNextId = async scope => {
    // in Mongo se va stoca urmatorul id disponibil
    // ex: pt. un batchSize=3, la primul request in blob se va stoca "3" iar in buffer-ul local vor fi disponibile numele 0,1 si 2
    // clientul va memora două numere:
    // numarul maxim pana la care poate aloca id-uri (exclusiv) (ex: "3")
    // id-ul disponibil pt. urmatoarea cerere (ex: poate stoca 1, 2 sau 3)
    // dupa fiecare cerere, acest id se va incrementa cu 1. Cand se ajunge la nr. maxim, se umple bufferul si se reia procesul

    if (currentId >= maxId) {
        await this.uploadInMemoryCountersFromMongo(scope);
    }

    // console.log("maxId: " + maxId);
    // console.log("currentId: " + currentId);

    // get from memory
    const nextId = currentId;
    currentId++; // set this id "as taken"

    return `Counter value for  ${scope}: ${nextId}`;
};

exports.uploadInMemoryCountersFromMongo = async scope => {
    // calculate the new counter
    const batchSize = this.getBatchSize(scope, config);

    // Increment nextId using findOneAndUpdate to ensure that the nextId field will be incremented atomically with the fetch of this document"
    const db = await mongoHelper.getDb();
    const result = await db
        .collection("counters")
        .findOneAndUpdate({ _id: scope }, { $inc: { nextId: batchSize } }, { returnOriginal: false });

    const newValueInBlob = result.value.nextId;

    //console.log("The new upper limit from  MongoDB: " + newValueInBlob);

    // update the "max" and "current" counters in memory
    currentId = newValueInBlob - batchSize; // set the start value of the new interval
    maxId = newValueInBlob; // set the end value of the new interval
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
    //console.log("new batchSize: " + batchSize);
    return batchSize;
    //return 3;
};
