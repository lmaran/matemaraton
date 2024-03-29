const mongoHelper = require("../helpers/mongo.helper");
const { ObjectId } = require("mongodb");

const collection = "students";

exports.getOneById = async (id) => {
    const db = await mongoHelper.getDb();
    return db.collection("students").findOne({ _id: new ObjectId(id) });
};

exports.getAll = async () => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).find().toArray();
};

exports.getAllFromSiiir = async () => {
    const db = await mongoHelper.getDb();
    return db
        .collection("siiir-elevi")
        .find({ "STATUS ELEV": "Situaţie şcolară deschisă" })
        .project({
            _id: 0,
            // CNP: 1,
            NUME: 1,
            PRENUME1: 1,
            PRENUME2: 1,
            PRENUME3: 1,
            "COD FORMATIUNE": 1,
            "TIP FORMATIUNE": 1,
            // NIVEL: 1,
            "STATUS ELEV": 1,
        })
        .toArray();
};

exports.insertMany = async (items) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertMany(items);
};

exports.insertOne = async (item) => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).insertOne(item);
};
