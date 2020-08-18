const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "courseSessions";

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

exports.getAllByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};

exports.getCourseSessionsByStudentId = async studentId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ $or: [{ studentsIds: studentId }, { "studentsFromOtherClasses.studentId": studentId }] })
        .toArray();
};

exports.getCourseSessionsByStudentsIds = async studentsIds => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({
            $or: [{ studentsIds: { $in: studentsIds } }, { "studentsFromOtherClasses.studentId": { $in: studentsIds } }]
        })
        .toArray();
};

exports.getCourseSessionsByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ classId })
        .sort({ date: -1 })
        .toArray();
};

exports.getCourseSessionsByClassIds = async classIds => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ classId: { $in: classIds } })
        .toArray();
};

exports.bulkWriteCourses = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).bulkWrite(mongoOps, { ordered: false });
};
