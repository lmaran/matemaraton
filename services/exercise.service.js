const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "exercises";

// exports.getAll = async () => {
//     const db = await mongoHelper.getDb();
//     return db
//         .collection(collection)
//         .find()
//         .toArray();
// };

exports.getAll = async (query) => {
    query = query || {};
    const db = await mongoHelper.getDb();

    let qr = db.collection(collection).find(query.filter, query.select || {});

    // if (query.$sort) {
    //     qr = qr.sort(query.$sort);
    // }
    if (query.skip) {
        qr = qr.skip(query.skip);
    }
    if (query.limit) {
        qr = qr.limit(query.limit);
    }
    return qr.toArray();
};

exports.count = async (filter) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).countDocuments(filter || {});
};

exports.getNumberOfSessionForClass = async (classId) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).countDocuments({ classId });
};

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getOneByCode = async (code) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ code });
};

exports.updateOne = async (item) => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectID(item._id);
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.getObjectId = () => new ObjectID();

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectID(id) });
};

exports.getAllByIds = async (ids) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: ids.map((x) => new ObjectID(x)) } })
        .toArray();
};

exports.insertSolution = async (item) => {
    const db = await mongoHelper.getDb();
    return db.collection("submissions").insertOne(item);
};
