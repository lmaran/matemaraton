const mongoHelper = require("../helpers/mongo.helper");

const studentsAndClassesCollection = "studentsAndClasses";

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

exports.getClassMapByStudentId = async (academicYear, studentId) => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsAndClassesCollection).findOne({ academicYear, studentId });
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
