const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "users";

exports.getOneByEmail = async email => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ email: email.toLowerCase() });
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getByIdWithoutPsw2 = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) }, { projection: { salt: 0, hashedPassword: 0 } });
};

exports.updateOne = async user => {
    const db = await mongoHelper.getDb();
    if (user.email) user.email = user.email.toLowerCase(); // ensures that the email is saved in lowerCase
    user._id = new ObjectID(user._id);
    return db.collection(collection).updateOne({ _id: user._id }, { $set: user });
};

exports.create = async user => {
    const db = await mongoHelper.getDb();
    if (user.email) user.email = user.email.toLowerCase(); // ensures that the email is saved in lowerCase
    user.createdOn = new Date();
    return db.collection(collection).insertOne(user);
};
