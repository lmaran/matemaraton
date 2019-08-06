/* global Buffer */

(function(userService) {
    const crypto = require("crypto");
    // const mongoHelper = require("../../data/mongoHelper");
    const mongoHelper = require("../../shared/helpers/mongo.helper");
    const mongoService = require("../../shared/helpers/mongo.service");
    const _ = require("lodash");
    const collection = "users";

    // ---------- OData ----------
    userService.getAll = function(odataQuery, next) {
        const query = mongoService.getQuery(odataQuery);
        if (query.$sort === undefined) query.$sort = { name: 1 }; // sort by name (asc)

        query.$select = query.$select || {};

        // v1:
        _.extend(query.$select, { salt: 0, hashedPassword: 0 }); // exclude 'salt' and 'psw'

        // v2:
        //_.extend(query.$select, {name:1, email:1, role:1});
        // if(query.$select.salt) delete query.$select.salt;
        // if(query.$select.hashedPassword) delete query.$select.hashedPassword;

        mongoService.getAll(collection, query, next);
    };

    // ---------- CRUD ----------
    userService.getById = function(id, next) {
        mongoService.getById(collection, id, next);
    };

    userService.create = function(user, next) {
        mongoService.create(collection, user, next);
    };

    userService.update = function(user, next) {
        mongoService.update(collection, user, next);
    };

    userService.updatePartial = function(user, next) {
        // replacing the entire object will delete the psw+salt
        mongoService.updatePartial(collection, user, next);
    };

    userService.remove = function(id, next) {
        mongoService.remove(collection, id, next);
    };

    // ---------- Misc ----------
    userService.getByValue = function(field, value, id, next) {
        mongoService.getByValue(collection, field, value, id, next);
    };

    userService.getByEmail = function(email, next) {
        mongoHelper.getDb(function(err, db) {
            if (err) return next(err, null);
            //db.collection('users').findOne({ email: email.toLowerCase() }, {salt:0, hashedPassword:0}, next);  // exclude 'salt' and 'psw'
            db.collection("users").findOne({ email: email.toLowerCase() }, next); // exclude 'salt' and 'psw'
        });
    };

    userService.getByIdWithoutPsw = function(id, next) {
        mongoHelper.getDb(function(err, db) {
            if (err) return next(err, null);
            id = mongoHelper.normalizedId(id);
            db.collection("users").findOne({ _id: id }, { salt: 0, hashedPassword: 0 }, next); // exclude 'salt' and 'psw'
        });
    };

    exports.getByIdWithoutPsw2 = async id => {
        const db = await mongoHelper.getDb();
        id = mongoHelper.normalizedId(id);
        const user = await db.collection("users").findOne({ _id: id }, { salt: 0, hashedPassword: 0 });
        return user;
    };

    userService.makeSalt = function() {
        return crypto.randomBytes(16).toString("base64");
    };

    userService.encryptPassword = function(password, salt) {
        if (!password || !salt) return "";
        const newSalt = new Buffer.from(salt, "base64");
        return crypto.pbkdf2Sync(password, newSalt, 10000, 64, "sha1").toString("base64");
    };

    userService.authenticate = function(plainText, hashedPassword, salt) {
        const psw = this.encryptPassword(plainText, salt);
        return psw === hashedPassword;
    };
})(module.exports);
