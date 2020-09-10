const mongoHelper = require("../helpers/mongo.helper");
//const { ObjectID } = require("mongodb");

const collection = "enrollments";

exports.insertOne = async item => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.getAllByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ classId })
        .toArray();
};

exports.getAllByClassIdAndParentId = async (classId, parentId) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ classId, parentId })
        .toArray();
};
