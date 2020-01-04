const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");
const userService = require("../services/user.service");
// const personService = require("../services/person.service");
const uuid = require("uuid/v4");

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

exports.changePassword = async (email, oldPassword, newPassword) => {
    const existingUser = await userService.getOneByEmail(email);

    if (!existingUser) {
        throw new Error("UnknownEmail");
    } else if (!(await bcrypt.compare(oldPassword, existingUser.password))) {
        throw new Error("IncorrectPassword");
    } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        existingUser.password = hashedPassword;

        await userService.updateOne(existingUser);

        const token = generateJWT(existingUser);
        return token;
    }
};

exports.signupByInvitationCode = async (firstName, lastName, password, invitationCode) => {
    const existingUser = await userService.getOneBySignupCode(invitationCode);
    if (existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);

        // update user info
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        //existingUser.email = email;
        existingUser.password = hashedPassword;
        existingUser.status = "active";
        existingUser.activatedOn = new Date();
        existingUser.emailVerified = true;

        await userService.updateOne(existingUser);

        // console.log(response.ops[0]);

        // const userRecord = response.ops[0];
        const token = generateJWT(existingUser);
        return token;
    } else throw new Error("InvalidInvitationCode");
};

exports.signupByUserRegistration = async (firstName, lastName, email, psw) => {
    const existingUser = await userService.getOneByEmail(email);
    if (existingUser && existingUser.status === "active") throw new Error("EmailAlreadyExists");

    const password = await bcrypt.hash(psw, 10);

    const uniqueId = existingUser && existingUser.signupCode ? existingUser.signupCode : uuid(); // keep the original code if exists

    if (existingUser) {
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.password = password;
        existingUser.status = "registered";
        existingUser.signupCode = uniqueId;

        await userService.updateOne(existingUser);
    } else {
        const newUser = {
            firstName,
            lastName,
            password,
            status: "registered",
            signupCode: uniqueId,
            email
        };
        await userService.insertOne(newUser);
    }

    return uniqueId;
};

exports.saveResetPasswordRequest = async (email, password) => {
    const existingUser = await userService.getOneByEmail(email);
    if (!existingUser || (existingUser && existingUser.status !== "active")) throw new Error("AccountNotExists");

    const resetPasswordCode = uuid();

    existingUser.resetPasswordCode = resetPasswordCode;
    existingUser.resetPasswordInfo = {
        newPassword: await bcrypt.hash(password, 10),
        requestDate: new Date()
    };

    await userService.updateOne(existingUser);

    return resetPasswordCode;
};

exports.signupByActivationCode = async activationCode => {
    const existingUser = await userService.getOneBySignupCode(activationCode);
    if (existingUser) {
        if (existingUser.status === "registered") {
            // update user info
            existingUser.status = "active";
            existingUser.activatedOn = new Date();
            existingUser.emailVerified = true;

            await userService.updateOne(existingUser);

            // const userRecord = response.ops[0];
            const token = generateJWT(existingUser);
            return token;
        } else if (existingUser.status === "active") {
            throw new Error("AccountAlreadyActivated");
        } else throw new Error("InvalidActivationCode");
    } else throw new Error("InvalidActivationCode");
};

exports.resetPasswordByCode = async resetPasswordCode => {
    const existingUser = await userService.getOneByResetPasswordCode(resetPasswordCode);

    if (!existingUser) throw new Error("InvalidResetPasswordCode");
    else if (existingUser.status !== "active") throw new Error("InactiveUser");
    else if (!existingUser.resetPasswordInfo) throw new Error("InvalideResetPasswordInfo");

    const pswInfo = existingUser.resetPasswordInfo; // shortcut

    // update user info
    existingUser.password = pswInfo.newPassword;
    existingUser.lastResetPasswordOn = new Date();
    delete existingUser.resetPasswordCode;
    delete existingUser.resetPasswordInfo;

    return await userService.updateOne(existingUser);
};

const generateJWT = user => {
    return jwt.sign(
        {
            data: {
                _id: user._id,
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
