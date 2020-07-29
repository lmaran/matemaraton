const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "courses2";

/**
 * CRUD operations
 */

exports.getAll = async filter => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find(filter)
        .toArray();
};

exports.getById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};
