const mongoHelper = require("../../shared/helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "teachers";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return await db
        .collection(collection)
        .find()
        .toArray();
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return await db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.insertOne = async teacher => {
    const db = await mongoHelper.getDb();
    return await db.collection(collection).insertOne(teacher);
};

exports.updateOne = async teacher => {
    const db = await mongoHelper.getDb();
    teacher._id = new ObjectID(teacher._id);
    return await db.collection(collection).updateOne({ _id: teacher._id }, teacher);
};

exports.deleteOneById = async id => {
    const db = await mongoHelper.getDb();
    id = mongoHelper.normalizedId(id);
    return await db.collection(collection).deleteOne({ _id: new ObjectID(id) });
};
