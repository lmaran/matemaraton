const mongoHelper = require("../../shared/helpers/mongo.helper");

const collection = "staffMembers";

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    const staff = await db
        .collection(collection)
        .find()
        .toArray();
    return staff;
};

// getOneById: async (id: any) => {
//     const db = await mongoHelper.getDb();
//     id = mongoHelper.normalizedId(id);
//     const teacher = await db.collection(collection).findOne({ _id: id });
//     return teacher;
// },

// insertOne: async (teacher: ITeacher) => {
//     const db = await mongoHelper.getDb();
//     return await db.collection(collection).insertOne(teacher);
// },

// updateOne: async (teacher: any) => {
//     const db = await mongoHelper.getDb();
//     teacher._id = mongoHelper.normalizedId(teacher._id);
//     return await db.collection(collection).updateOne({ _id: teacher._id }, teacher);
// },

// deleteOneById: async (id: any) => {
//     const db = await mongoHelper.getDb();
//     id = mongoHelper.normalizedId(id);
//     return await db.collection(collection).deleteOne({ _id: id });
// },
