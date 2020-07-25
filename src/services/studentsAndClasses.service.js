const mongoHelper = require("../helpers/mongo.helper");

const studentsAndClassesCollection = "studentsAndClasses";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(studentsAndClassesCollection)
        .find()
        .toArray();
};

exports.getStudentsMapByClassId = async classId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(studentsAndClassesCollection)
        .find({ classId })
        .toArray();

    // flatten the result
    // console.log(result);
    // return result.map(x => x.studentId);
};

exports.getClassMapByStudentId = async (classId, studentId) => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).findOne({ classId, studentId });
};

exports.getClassesByStudentId = async studentId => {
    const db = await mongoHelper.getDb();
    return db
        .collection(studentsAndClassesCollection)
        .find({ studentId })
        .toArray();
};

exports.insertManyStudentsAndClasses = async studentsAndClasses => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).insertMany(studentsAndClasses);
};

exports.bulkWrite = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).bulkWrite(mongoOps, { ordered: false });
};

// exports.getStudentsPerClass = async classId => {
//     const db = await mongoHelper.getDb();
//     const studentsPerClass = await db
//         .collection("studentsAndClasses")
//         .find({ "class.id": classId }, { projection: { _id: 0, student: 1 } })
//         .sort({ "student.lastName": 1 })
//         .toArray();

//     // flatten result
//     return studentsPerClass.map(x => {
//         return {
//             id: x.student.id,
//             firstName: x.student.firstName,
//             lastName: x.student.lastName
//         };
//     });
// };
