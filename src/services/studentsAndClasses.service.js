const mongoHelper = require("../helpers/mongo.helper");

const studentsAndClassesCollection = "studentsAndClasses";

exports.getStudentsIdsPerClassId = async classId => {
    const db = await mongoHelper.getDb();
    const result = await db
        .collection(studentsAndClassesCollection)
        .find({ classId })
        .toArray();

    // flatten the result
    // console.log(result);
    return result.map(x => x.studentId);
};

exports.getClassIdByStudentId = async (academicYear, studentId) => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).findOne({ academicYear, studentId });
};

// exports.getAllClassesIdPerStudent = async studentId => {
//     const db = await mongoHelper.getDb();
//     return await db
//         .collection(collection)
//         .find({ studentId: studentId })
//         .toArray();
// };

exports.getStudentAndClassByStudentIdAndYear = async (studentId, academicYear) => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).findOne({ "student.id": studentId, academicYear });
};

exports.insertManyStudentsAndClasses = async studentsAndClasses => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).insertMany(studentsAndClasses);
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
