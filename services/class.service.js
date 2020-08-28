const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "classes";

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

exports.getAllByIds = async ids => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: ids.map(x => new ObjectID(x)) } })
        .toArray();
};
