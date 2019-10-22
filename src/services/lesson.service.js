const mongoHelper = require("../../shared/helpers/mongo.helper");

const collection = "lessons";

exports.getLessonsForClass = async classId => {
    const db = await mongoHelper.getDb();
    return await db
        .collection(collection)
        .find({ "class.id": classId.toString() })
        .sort({ subjectOrderInGradebook: 1 })
        .toArray();
};

exports.getLessonsForTeacher = async (teacherId, academicYear) => {
    const db = await mongoHelper.getDb();
    return await db
        .collection(collection)
        .find({ academicYear: academicYear, "teacher.id": teacherId })
        .sort({ "class.name": 1 })
        .toArray();
};
