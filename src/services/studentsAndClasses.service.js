const mongoHelper = require("../../shared/helpers/mongo.helper");

const collection = "studentsAndClasses";

exports.getStudentsIdsPerClass = async classId => {
    const db = await mongoHelper.getDb();
    const result = await db
        .collection(collection)
        .find({ "class.id": classId }, { projection: { _id: 0, student: 1 } })
        .toArray();

    // flatten the result
    // console.log(result);
    return result.map(x => x.student.id);
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
    return await db.collection(collection).findOne({ "student.id": studentId, academicYear });
};

exports.insertManyStudentsPerClass = async studentsPerClass => {
    const db = await mongoHelper.getDb();
    return await db.collection("studentsPerClass").insertMany(studentsPerClass);
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
