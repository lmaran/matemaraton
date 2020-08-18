const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const collection = "persons";

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).findOne({ _id: new ObjectID(id) });
};

// exports.getAll = async () => {
//     const db = await mongoHelper.getDb();
//     return db
//         .collection(collection)
//         .find()
//         .toArray();
// };

exports.getAllByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};

exports.bulkWritePersons = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(collection).bulkWrite(mongoOps, { ordered: false });
};

exports.getStudentsAndTheirParentsByIds = async studentsIds => {
    const studentsIdsAsObjectID = studentsIds.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ $or: [{ _id: { $in: studentsIdsAsObjectID } }, { studentIds: { $in: studentsIds } }] })
        .toArray();
};

exports.getStudentAndTheirParentsById = async studentId => {
    const studentIdAsObjectID = new ObjectID(studentId);
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ $or: [{ _id: studentIdAsObjectID }, { studentIds: studentId }] })
        .toArray();
};

// exports.getParentAndTheirStudentsById = async parentId => {
//     const parentIdAsObjectID = new ObjectID(parentId);
//     const db = await mongoHelper.getDb();
//     return db
//         .collection(personsCollection)
//         .find({ $or: [{ _id: parentIdAsObjectID }, { parentIds: parentId }] })
//         .toArray();
// };

exports.getParentsByStudentId = async id => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ studentIds: id })
        .toArray();
};

// exports.insertMany = async items => {
//     const db = await mongoHelper.getDb();
//     return db.collection(personsCollection).insertMany(items);
// };

// exports.insertOne = async student => {
//     const db = await mongoHelper.getDb();
//     return db.collection(personsCollection).insertOne(student);
// };
