const config = require("../config");
const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
let theDb; // this will be re-used so the db is only created once (on first request).

exports.getDb = async () => {
    try {
        if (!theDb) {
            if (!config.mongo || !config.mongo.uri) {
                throw new Error("Nu este definit un connection string pentru Mongo.");
            }
            if (!config.mongo || !config.mongo.dbName) {
                throw new Error("Nu este definit numele bazei de date.");
            }
            const client = await MongoClient.connect(config.mongo.uri, config.mongo.options);
            const db = client.db(config.mongo.dbName);

            theDb = db;
            return db;
        } else {
            // db already exists...
            return theDb;
        }
    } catch (error) {
        throw new Error(error);
    }
};

// used by some tests
exports.removeDbFromCache = () => {
    theDb = null;
};

exports.normalizedId = id => {
    if (ObjectID.isValid(id)) {
        return new ObjectID(id);
    } else {
        return id;
    }
};
