const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "sections";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().sort({ position: 1 }).toArray();
};

exports.getAllForUser = async (user) => {
    const db = await mongoHelper.getDb();
    const filter = mongoHelper.getAuthFilterForAll(user);
    return db.collection(collection).find(filter).sort({ position: 1 }).toArray();
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

exports.increasePositionsBetweenNewAndOld = async (newPosition, oldPosition) => {
    const db = await mongoHelper.getDb();
    // Increase positions of documents between new and old positions (useful for update)
    await db.collection(collection).updateMany({ position: { $gte: newPosition, $lt: oldPosition } }, { $inc: { position: 1 } });
};

exports.decreasePositionsBetweenOldAndNew = async (oldPosition, newPosition) => {
    const db = await mongoHelper.getDb();
    // Decrease positions of documents between old and new positions (useful for update)
    await db.collection(collection).updateMany({ position: { $gt: oldPosition, $lte: newPosition } }, { $inc: { position: -1 } });
};

exports.increasePositionsAbovePosition = async (position) => {
    const db = await mongoHelper.getDb();
    // Increase positions of documents above a specified position (useful for insert)
    await db.collection(collection).updateMany({ position: { $gte: position } }, { $inc: { position: 1 } });
};

exports.decreasePositionsAbovePosition = async (position) => {
    const db = await mongoHelper.getDb();
    // Decrease positions of documents above a specified position (useful for delete)
    await db.collection(collection).updateMany({ position: { $gt: position } }, { $inc: { position: -1 } });
};

exports.getObjectId = () => new ObjectId();
