const mongoHelper = require("../helpers/mongo.helper");
// const { ObjectId } = require("mongodb");
const collection = "roleAssignments";

exports.getRolesBySubjectId = async (subjectId) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find({ subjectId: subjectId }).toArray();
};
