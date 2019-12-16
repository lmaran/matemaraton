const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userService = require("../services/user.service");
const config = require("../config");

exports.login = async (email, password) => {
    try {
        const userRecord = await userService.getOneByEmail(email.toLowerCase());
        if (!userRecord) {
            throw new Error("Email sau parolă incorectă");
        } else {
            const matchPassword = await bcrypt.compare(password, userRecord.password);

            if (!matchPassword) {
                throw new Error("Email sau parolă incorectă");
            }
        }

        return {
            user: {
                email: userRecord.email,
                firstName: userRecord.firstName,
                lastName: userRecord.lastName
            },
            token: generateJWT(userRecord)
        };
    } catch (error) {
        throw new Error(error);
    }
};

// only for validations
exports.foundCredentials = async (email, password) => {
    const userRecord = await userService.getOneByEmail(email.toLowerCase());
    if (!userRecord) {
        return false; // email not found
    } else {
        const matchPassword = await bcrypt.compare(password, userRecord.password);

        if (!matchPassword) return false; // incorrect password
    }
    return true;
};

exports.signUp = async (email, password) => {
    const firstName = "My First Name";
    const lastName = "My Last Name";

    const hashedPassword = await bcrypt.hash(password, 10);

    const response = await userService.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        createdOn: new Date()
    });

    const userRecord = response.ops[0];

    // console.log("userRecord:");
    // console.log(userRecord);

    return {
        user: {
            email: userRecord.email,
            firstName: userRecord.firstName,
            lastName: userRecord.lastName
        },
        token: generateJWT(userRecord)
    };
};

const generateJWT = user => {
    return jwt.sign(
        {
            data: {
                _id: user._id,
                // name: user.name,
                email: user.email
            }
        },
        config.session_secret,
        { expiresIn: 60 * 60 * 24 * 365 } // in seconds
    );
};
