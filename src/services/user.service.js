const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "users";

// to prevent duplicates, we use an unique index for email (with allow for null)
// db.users.createIndex(
//     { email: 1 },
//     { unique: true, partialFilterExpression: { email: {"$exists": true } }}
//  )
exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().project({ password: 0 }).toArray();
};

exports.getOneByEmail = async (email) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ email: email.toLowerCase() });
};

exports.getOneBySignupCode = async (signupCode) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ signupCode });
};

exports.getOneByResetPasswordCode = async (resetPasswordCode) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ resetPasswordCode });
};

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getOneByIdWithoutPsw = async (id) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .findOne({ _id: new ObjectID(id) }, { projection: { password: 0 } });
};

exports.updateOne = async (user) => {
    const db = await mongoHelper.getDb();
    user._id = new ObjectID(user._id);
    return db
        .collection(collection)
        .updateOne({ _id: user._id }, { $set: user });
};

exports.resetPassword = async (
    userIdAsString,
    modifiedFields,
    removedFields
) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .updateOne(
            { _id: new ObjectID(userIdAsString) },
            { $set: modifiedFields, $unset: removedFields }
        );
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertOne(item);
};

exports.deleteOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).deleteOne({ _id: new ObjectID(id) });
};
