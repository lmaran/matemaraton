const mongoHelper = require("../helpers/mongo.helper");
// const { ObjectID } = require("mongodb");

const coursesCollection = "courses";

exports.getCoursesByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ "class.id": classId })
        .sort({ date: -1 })
        .toArray();
};

exports.getCoursesByClassIdAndStudentId = async (classId, studentId) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ "class.id": classId, studentsIds: studentId })
        .toArray();
};

exports.bulkWriteCourses = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).bulkWrite(mongoOps, { ordered: false });
};
