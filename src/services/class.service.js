const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const classesCollection = "classes";

exports.getClassById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(classesCollection).findOne({ _id: new ObjectID(id) });
};

exports.getClassByStudentId = async (academicYear, studentId) => {
    const db = await mongoHelper.getDb();
    return db.collection(classesCollection).findOne({ academicYear, studentsIds: studentId });
};
