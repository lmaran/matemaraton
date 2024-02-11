const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "lessons";

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

    qr.sort({ _id: -1 }); // sort descending
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

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectId(id) });
};

exports.updateOne = async (item) => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectId(item._id);
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

exports.getObjectId = () => new ObjectId();

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectId(id) });
};

exports.getAllByIds = async (ids) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: ids.map((x) => new ObjectId(x)) } })
        .toArray();
};

exports.getAllNamesByIds = async (ids) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: ids.map((x) => new ObjectId(x)) } })
        .project({ name: 1 })
        .toArray();
};
