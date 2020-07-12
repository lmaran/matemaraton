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

exports.getByCode = async code => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ code });
};

exports.updateOne = async exercise => {
    const db = await mongoHelper.getDb();
    //if (user.email) user.email = user.email.toLowerCase(); // ensures that the email is saved in lowerCase
    exercise._id = new ObjectID(exercise._id);
    //problem.modifiedOn = new Date();
    return db.collection(collection).updateOne({ _id: exercise._id }, { $set: exercise });
};

exports.updateOneByCode = async exercise => {
    const db = await mongoHelper.getDb();
    //if (user.email) user.email = user.email.toLowerCase(); // ensures that the email is saved in lowerCase
    //exercise._id = new ObjectID(exercise._id);
    //problem.modifiedOn = new Date();
    return db.collection(collection).updateOne({ code: exercise.code }, { $set: exercise });
};

exports.insertOne = async exercise => {
    const db = await mongoHelper.getDb();
    exercise.createdOn = new Date();
    return db.collection(collection).insertOne(exercise);
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
