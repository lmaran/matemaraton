const config = require("../config");
const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
let theDb; // this will be re-used so the db is only created once (on first request).

let _db;
let _clientAsPromise;

// (async function() {
//   // Connection URL
//   const url = config.mongo.uri;
//   // Database Name
//   const dbName = onfig.mongo.dbName;
//   const client = new MongoClient(url, { useNewUrlParser: true });

//   try {
//     // Use connect method to connect to the Server
//     await client.connect();

//     const db = client.db(dbName);
//   } catch (err) {
//     console.log(err.stack);
//   }

//   client.close();
// })();

exports.getDb = async () => {
    try {
        if (!_db) {
            const client = await _clientAsPromise;
            const db = client.db(config.mongo.dbName);
            _db = db;
            return db;
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

// https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
exports.init = () => {
    try {
        if (!config.mongo || !config.mongo.uri) {
            throw new Error("Nu este definit un connection string pentru Mongo.");
        }
        if (!config.mongo || !config.mongo.dbName) {
            throw new Error("Nu este definit numele bazei de date.");
        }
        // const client = new MongoClient(config.mongo.uri, { useNewUrlParser: true });

        // await client.connect();

        // sconst db = client.db(dbName);

        const clientAsPromise = MongoClient.connect(config.mongo.uri + "/matemaraton-dev", config.mongo.options);
        _clientAsPromise = clientAsPromise;
        return clientAsPromise;
    } catch (error) {
        throw new Error(error);
    }
};

exports.getDb_old = async () => {
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
