const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "lessons";

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectId(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};

exports.getLessonTitlesByIds = async (ids) => {
    const idsAsObjectID = ids.map((x) => new ObjectId(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: idsAsObjectID } })
        .project({ title: 1 })
        .toArray();
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.updateOne = async (item) => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectId(item._id);
    //problem.modifiedOn = new Date();
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectId(id) });
};
