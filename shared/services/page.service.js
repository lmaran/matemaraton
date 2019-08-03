const mongoHelper = require("../../shared/helpers/mongo.helper");

const collection = "pages";

(exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    const teachers = await db
        .collection(collection)
        .find()
        .toArray();
    return teachers;
}),
    (exports.getOneById = async id => {
        const db = await mongoHelper.getDb();
        id = mongoHelper.normalizedId(id);
        return await db.collection(collection).findOne({ _id: id });
    }),
    (exports.getOneBySlug = async slug => {
        const db = await mongoHelper.getDb();
        return await db.collection(collection).findOne({ slug: slug });
    }),
    (exports.insertOne = async page => {
        const db = await mongoHelper.getDb();
        return await db.collection(collection).insertOne(page);
    }),
    (exports.updateOne = async page => {
        const db = await mongoHelper.getDb();
        page._id = mongoHelper.normalizedId(page._id);
        return await db.collection(collection).updateOne({ _id: page._id }, { $set: page });
    }),
    (exports.deleteOneById = async id => {
        const db = await mongoHelper.getDb();
        id = mongoHelper.normalizedId(id);
        return await db.collection(collection).deleteOne({ _id: id });
    });
