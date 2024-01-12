const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "files";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};

exports.getAllByIds = async (ids) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: ids.map((x) => new ObjectId(x)) } })
        .toArray();
};

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectId(id) });
};

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectId(id) });
};

exports.deleteAllByIds = async (fileIds) => {
    const db = await mongoHelper.getDb();
    const filter = { _id: { $in: fileIds.map((x) => new ObjectId(x)) } };
    return db.collection(collection).deleteMany(filter);
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertOne(item);
};

exports.insertMany = async (items) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertMany(items);
};

// exports.updateOne = async (item) => {
//     const db = await mongoHelper.getDb();
//     item._id = new ObjectId(item._id);
//     return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
// };

exports.updateSourceIds = async (fileIds, exerciseId) => {
    const db = await mongoHelper.getDb();
    const filter = { _id: { $in: fileIds.map((x) => new ObjectId(x)) } };
    const updateDoc = { $set: { sourceId: exerciseId } };
    return db.collection(collection).updateMany(filter, updateDoc);
};

exports.getObjectId = (id) => {
    return id ? new ObjectId(id) : new ObjectId();
};
