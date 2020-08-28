const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "courses";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find()
        .toArray();
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getCourseSummaryByCode = async code => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ code: code }, { projection: { code: 1, name: 1 } });
};
