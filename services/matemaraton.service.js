const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const presenceCollection = "presence";
const coursesCollection = "courses";
const studentsCollection = "persons";
const editionsCollection = "editions";

exports.getPresencePerGroup = async (period, grade, groupName) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(presenceCollection)
        .find({ period: period, grade: grade, groupName: groupName })
        .sort({ date: -1 })
        .toArray();
};

exports.getCoursesPerGroup = async (period, grade, groupName) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find({ period: period, grade: grade, groupName: groupName })
        .sort({ date: -1 })
        .toArray();
};

exports.getPresencePerGrade = async (period, grade) => {
    const db = await mongoHelper.getDb();
    return db
        .collection(presenceCollection)
        .find({ period: period, grade: grade })
        .sort({ date: -1 })
        .toArray();
};

exports.getPresencePerPeriod = async period => {
    const db = await mongoHelper.getDb();
    return db
        .collection(presenceCollection)
        .find({ period: period })
        .sort({ date: -1 })
        .toArray();
};

exports.getCurrentEdition = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(editionsCollection).findOne({ isCurrent: true });
};

exports.getSelectedEdition = async edition => {
    const db = await mongoHelper.getDb();
    return db.collection(editionsCollection).findOne({ edition: edition });
};

exports.getCourse = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(coursesCollection).findOne({ _id: new ObjectID(id) });
};

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(studentsCollection).findOne({ _id: new ObjectID(id) });
};

exports.getStudentsPerGrade = async (period, grade) => {
    const db = await mongoHelper.getDb();
    return await db
        .collection(studentsCollection)
        .aggregate([
            { $match: { "grades.period": period, "grades.grade": grade } },
            { $unwind: "$grades" },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    shortFirstName: 1,
                    grade: "$grades.grade",
                    class: "$grades.class"
                }
            }
        ])
        .toArray();
};

exports.getAllPresences = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(presenceCollection)
        .find()
        .toArray();
};

exports.getAllCourses = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection(coursesCollection)
        .find()
        .toArray();
};

exports.insertManyCourses = async items => {
    const db = await mongoHelper.getDb();
    return await db.collection(coursesCollection).insertMany(items);
};
