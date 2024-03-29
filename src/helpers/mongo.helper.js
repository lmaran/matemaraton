// in this case we have two connections: one for session, one for the regular interactions
// see also: https://stackoverflow.com/questions/41364072/running-an-async-function-before-express-js-start

const config = require("../config");
const mongodb = require("mongodb");
const { ObjectId } = mongodb;

const MongoClient = mongodb.MongoClient;
const dbName = config.mongo_dbName;
const uri = config.mongo_uri;

let _db;
let _clientAsPromise;

// https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
(() => {
    if (!uri) {
        throw new Error("Nu este definit un connection string pentru Mongo.");
    }
    if (!dbName) {
        throw new Error("Nu este definit numele bazei de date.");
    }

    // about parameters: https://stackoverflow.com/a/57547013
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    _clientAsPromise = client.connect();
})();

exports.getDb = async (specificDbName) => {
    try {
        if (!_db) {
            const client = await _clientAsPromise;
            _db = client.db(specificDbName || dbName);
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

exports.getAuthFilterForOneById = (user, id) => {
    const idFilter = { _id: new ObjectId(id) };

    if (user) {
        if (user.isAdmin) {
            return idFilter;
        } else {
            const authFilter = { $or: [{ isPrivate: false }, { ownerId: user._id.toString() }] };
            return { $and: [authFilter, idFilter] };
        }
    } else {
        const authFilter = { isPrivate: false };
        return { $and: [authFilter, idFilter] };
    }
};

exports.getAuthFilterForAll = (user) => {
    if (user) {
        if (user.isAdmin) {
            return {};
        } else {
            return { $or: [{ isPrivate: false }, { ownerId: user._id.toString() }] };
        }
    } else {
        return { isPrivate: false };
    }
};
