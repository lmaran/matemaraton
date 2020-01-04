const mongoHelper = require("../helpers/mongo.helper");
// const { ObjectID } = require("mongodb");
const collection = "roleDefinitions";

exports.getRoleDefinitionsByRoleNames = async roleNames => {
    const db = await mongoHelper.getDb();
    return db
        .collection(collection)
        .find({ roleName: { $in: roleNames } })
        .toArray();
};
