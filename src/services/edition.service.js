const mongoHelper = require("../helpers/mongo.helper");

const collection = "editions";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};
