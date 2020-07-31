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
