const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "courses";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getCourseSummaryByCode = async (code) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ code: code }, { projection: { code: 1, name: 1 } });
};

exports.updateOne = async (item) => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectID(item._id);
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectID(id) });
};

exports.getObjectId = () => new ObjectID();
