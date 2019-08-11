const crypto = require("crypto");

exports.makeSalt = () => {
    return crypto.randomBytes(16).toString("base64");
};

exports.encryptPassword = (password, salt) => {
    if (!password || !salt) return "";
    const newSalt = new Buffer.from(salt, "base64");
    return crypto.pbkdf2Sync(password, newSalt, 10000, 64, "sha1").toString("base64");
};

exports.authenticate = (plainText, hashedPassword, salt) => {
    const psw = this.encryptPassword(plainText, salt);
    return psw === hashedPassword;
};
