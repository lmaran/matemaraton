const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "exercises";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find()
        .toArray();
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getOneByCode = async code => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ code });
};

exports.updateOne = async item => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectID(item._id);
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.updateOneByCode = async exercise => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).updateOne({ code: exercise.code }, { $set: exercise });
};

exports.insertOne = async item => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.getObjectId = () => new ObjectID();

// exports.deleteOneById = async id => {
//     const db = await mongoHelper.getDb();
//     id = mongoHelper.normalizedId(id);
//     return db.collection(collection).deleteOne({ _id: id });
// };

exports.deleteOneByCode = async code => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ code });
};

exports.getAllByCodes = async codes => {
    //const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ code: { $in: codes } })
        .toArray();
};
