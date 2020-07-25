const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const homeworkCollection = "homework";

exports.getHomeworkRequestById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(homeworkCollection).findOne({ _id: new ObjectID(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(homeworkCollection)
        .find()
        .toArray();
};

exports.getHomeworkRequestsByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(homeworkCollection)
        .find({ classId: classId })
        .toArray();
};
