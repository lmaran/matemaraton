const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const coursesCollection = "course-sessions";

exports.getCourseSessionById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).findOne({ _id: new ObjectID(id) });
};

exports.getCourseSessionsByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};

exports.getCourseSessionsByStudentId = async studentId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ $or: [{ studentsIds: studentId }, { "studentsFromOtherClasses.studentId": studentId }] })
        .toArray();
};

exports.getCourseSessionsByStudentsIds = async studentsIds => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({
            $or: [{ studentsIds: { $in: studentsIds } }, { "studentsFromOtherClasses.studentId": { $in: studentsIds } }]
        })
        .toArray();
};

exports.getCourseSessionsByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ classId })
        .sort({ date: -1 })
        .toArray();
};

exports.getCourseSessionsByClassIds = async classIds => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ classId: { $in: classIds } })
        .toArray();
};

// exports.getCourseSessionsByClassIdAndStudentId = async (classId, studentId) => {
//     const db = await mongoHelper.getDb();
//     return db
//         .collection(coursesCollection)
//         .find({ classId: classId, studentsIds: studentId })
//         .toArray();
// };

exports.bulkWriteCourses = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).bulkWrite(mongoOps, { ordered: false });
};
