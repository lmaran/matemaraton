const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");

exports.getHashedPassword = async psw => await bcrypt.hash(psw, 10);

exports.matchPassword = async (textPassword, hashedPassword) => {
    return await bcrypt.compare(textPassword, hashedPassword);
};

exports.generateJWT = user => {
    return jwt.sign(
        {
            data: {
                _id: user._id,
                // name: user.name,
                email: user.email
            }
        },
        config.session_secret,
        // { expiresIn: 60 * 60 * 24 * 365 } // in seconds
        { expiresIn: "6h" }
    );
};

exports.getJWTPayload = async jwt => {
    return await jwt.verify(jwt, config.session_secret);
};
