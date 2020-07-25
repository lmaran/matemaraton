const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const coursesCollection = "courses";

exports.getCourseById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).findOne({ _id: new ObjectID(id) });
};

exports.getCoursesByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};

exports.getCoursesByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ classId })
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
        .find({ classId: { $in: classIds } })
        .toArray();
};

exports.getCoursesByClassIdAndStudentId = async (classId, studentId) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ classId: classId, studentsIds: studentId })
        .toArray();
};

exports.bulkWriteCourses = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).bulkWrite(mongoOps, { ordered: false });
};
