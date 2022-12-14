const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "classes";

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return (
        db
            .collection(collection)
            //.find({ isPublished: true })
            .find()
            .toArray()
    );
};

exports.getOpenEnrollments = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find({ "enrollmentInfo.status": "open" }).toArray();
};

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

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    item.createdOn = new Date();
    return db.collection(collection).insertOne(item);
};

// exports.updateOne = async (item) => {
//     const db = await mongoHelper.getDb();
//     item._id = new ObjectID(item._id);
//     return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
// };

exports.updateOne = async (idAsString, modifiedFields, removedFields) => {
    const db = await mongoHelper.getDb();

    const operations = {};
    if (modifiedFields && Object.keys(modifiedFields).length > 0) operations.$set = modifiedFields;
    if (removedFields && Object.keys(removedFields).length > 0) operations.$unset = removedFields;

    return db.collection(collection).updateOne({ _id: new ObjectID(idAsString) }, operations);
};
