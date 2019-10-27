const mongoHelper = require("../helpers/mongo.helper");
const { ObjectID } = require("mongodb");

const personsCollection = "persons";

exports.getOneById = async id => {
    const db = await mongoHelper.getDb();
    return db.collection(personsCollection).findOne({ _id: new ObjectID(id) });
};

exports.getAllPersons = async filter => {
    const db = await mongoHelper.getDb();
    return db
        .collection(personsCollection)
        .find(filter)
        .toArray();
};

exports.getPersonsByIds = async ids => {
    const idsAsObjectID = ids.map(x => new ObjectID(x));
    const db = await mongoHelper.getDb();
    return db
        .collection(personsCollection)
        .find({ _id: { $in: idsAsObjectID } })
        .toArray();
};

exports.bulkWritePersons = async mongoOps => {
    const db = await mongoHelper.getDb();
    return db.collection(personsCollection).bulkWrite(mongoOps, { ordered: false });
};

// exports.insertMany = async items => {
//     const db = await mongoHelper.getDb();
//     return db.collection(personsCollection).insertMany(items);
// };

// exports.insertOne = async student => {
//     const db = await mongoHelper.getDb();
//     return db.collection(personsCollection).insertOne(student);
// };
