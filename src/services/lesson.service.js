const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "lessons";

exports.getById = async id => {
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

exports.getByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};
exports.getByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};

exports.getLessonNamesByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: idsAsObjectID } })
        .project({ name: 1 })
        .toArray();
};

exports.insertOne = async item => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.updateOne = async item => {
    const db = await mongoHelper.getDb();
    //if (user.email) user.email = user.email.toLowerCase(); // ensures that the email is saved in lowerCase
    item._id = new ObjectID(item._id);
    //problem.modifiedOn = new Date();
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.deleteOne = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectID(id) });
};
