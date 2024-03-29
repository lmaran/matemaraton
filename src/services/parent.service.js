const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "parents";

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectId(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertOne(item);
};
