const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");
const userService = require("../services/user.service");
const personService = require("../services/person.service");

exports.login = async (email, password) => {
    const userRecord = await userService.getOneByEmail(email);

    if (!userRecord) {
        throw new Error("UnknownEmail");
    } else if (!(await bcrypt.compare(password, userRecord.password))) {
        throw new Error("IncorrectPassword");
    } else {
        const token = generateJWT(userRecord);
        return token;
    }
};

exports.signup = async (firstName, lastName, email, password, invitationCode) => {
    if (invitationCode) {
        // we know that the email is verified
        const existingUser = await userService.getOneByInvitationCode(invitationCode);
        if (existingUser) {
            // TODO: check if the invitationCode has expired

            // update user info
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.password = hashedPassword;

            await userService.updateOne(existingUser);
        } else throw new Error("InvalidInvitationCode");
    } else {
        // no invitationCode
        if (await userService.getOneByEmail(email)) throw new Error("EmailAlreadyExists");

        // TODO: check if we have a person (student, parent, teacher...) with this email address
        if (await personService.getOneByEmail(email)) throw new Error("PersonNotExist");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await userService.insertOne({
        firstName,
        lastName,
        email,
        password: hashedPassword
    });

    const userRecord = response.ops[0];
    const token = generateJWT(userRecord);
    return token;
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
        // { expiresIn: 60 * 60 * 24 * 365 } // in seconds
        { expiresIn: "6h" }
    );
};

exports.getJwtPayload = async token => {
    const payload = await jwt.verify(token, config.session_secret);
    return payload;
};
