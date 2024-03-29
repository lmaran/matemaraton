const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "sections";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};

exports.getAllForUser = async (user) => {
    const db = await mongoHelper.getDb();
    const filter = mongoHelper.getAuthFilterForAll(user);
    return db.collection(collection).find(filter).toArray();
};

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectId(id) });
};

exports.getOneByIdForUser = async (id, user) => {
    const db = await mongoHelper.getDb();
    const filter = mongoHelper.getAuthFilterForOneById(user, id);
    return db.collection(collection).findOne(filter);
};

exports.updateOne = async (item) => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectId(item._id);
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectId(id) });
};

exports.getObjectId = () => new ObjectId();
