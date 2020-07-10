const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "exercises";

exports.getAll = async filter => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find(filter)
        .toArray();
};

exports.getById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.updateOne = async problem => {
    const db = await mongoHelper.getDb();
    //if (user.email) user.email = user.email.toLowerCase(); // ensures that the email is saved in lowerCase
    problem._id = new ObjectID(problem._id);
    //problem.modifiedOn = new Date();
    return db.collection(collection).updateOne({ _id: problem._id }, { $set: problem });
};

exports.getObjectId = () => new ObjectID();
