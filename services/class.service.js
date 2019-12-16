const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const classesCollection = "classes";

exports.getClassById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(classesCollection).findOne({ _id: new ObjectID(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(classesCollection)
        .find()
        .toArray();
};
