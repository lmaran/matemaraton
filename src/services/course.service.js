const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const coursesCollection = "courses";

exports.getCourseById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).findOne({ _id: new ObjectID(id) });
};

exports.getCoursesByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ "class.id": classId })
        .sort({ date: -1 })
        .toArray();
};

exports.getCoursesByStudentId = async studentId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ $or: [{ studentsIds: studentId }, { "studentsFromOtherClasses.studentId": studentId }] })
        .toArray();
};

exports.getCoursesByStudentsIds = async studentsIds => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({
            $or: [{ studentsIds: { $in: studentsIds } }, { "studentsFromOtherClasses.studentId": { $in: studentsIds } }]
        })
        .toArray();
};

exports.getCoursesByClassIds = async classIds => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ "class.id": { $in: classIds } })
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
