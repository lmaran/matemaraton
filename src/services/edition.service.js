const mongoHelper = require("../helpers/mongo.helper");

const classesCollection = "editions";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(classesCollection)
        .find()
        .toArray();
};
