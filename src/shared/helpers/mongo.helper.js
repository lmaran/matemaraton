const config = require("../config");
const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const dbName = config.mongo_dbName;
const url = config.mongo_url;

let _db;
let _clientAsPromise;

// https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
(() => {
    if (!url) {
        throw new Error("Nu este definit un connection string pentru Mongo.");
    }
    if (!dbName) {
        throw new Error("Nu este definit numele bazei de date.");
    }

    // about parameters: https://stackoverflow.com/a/57547013
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        _clientAsPromise = client.connect();
        return _clientAsPromise;
    } catch (error) {
        throw new Error(error);
    }
})();

exports.getDb = async () => {
    try {
        if (!_db) {
            const client = await _clientAsPromise;
            _db = client.db(dbName);
            return _db;
        } else {
            // db already exists...
            return _db;
        }
    } catch (error) {
        throw new Error(error);
    }
};

exports.getClientAsPromise = () => {
    return _clientAsPromise;
};
