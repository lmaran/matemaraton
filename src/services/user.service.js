const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "users";

exports.getOneByEmail = async email => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ email });
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getByIdWithoutPsw2 = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) }, { projection: { salt: 0, hashedPassword: 0 } });
};

exports.updateOne = async item => {
    const db = await mongoHelper.getDb();
    item._id = new ObjectID(item._id);
    return db.collection(collection).updateOne({ _id: item._id }, { $set: item });
};

exports.create = async user => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertOne(user);
};

exports.getOneByEmail = async email => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ email });
};
