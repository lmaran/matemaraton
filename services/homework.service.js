const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "homework";

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find()
        .toArray();
};

exports.getAllByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ classId: classId })
        .toArray();
};
