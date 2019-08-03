const mongoHelper = require("../../shared/helpers/mongo.helper");

const collection = "timetables";
const itemsCollection = "timetableItems";

exports.getActiveTimetableForAcademicYear = async academicYear => {
    const db = await mongoHelper.getDb();
    return await db.collection(collection).findOne({ academicYear: academicYear, isActive: true });
};

exports.getTimetableItemsForClass = async (timetableId, classId) => {
    const db = await mongoHelper.getDb();
    return await db
        .collection(itemsCollection)
        .find({ timetableId: timetableId, "class.id": classId })
        .toArray();
};

exports.getTimetableItems = async timetableId => {
    const db = await mongoHelper.getDb();
    return await db
        .collection(itemsCollection)
        .find({ timetableId: timetableId })
        .toArray();
};
