const mongoHelper = require("../../shared/helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "users";

exports.getOneByEmail = async email => {
    const db = await mongoHelper.getDb();
    return await db.collection(collection).findOne({ email });
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return await db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.updateOne = async item => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectID(item._id);
    return await db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};
