const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");
const userService = require("../services/user.service");
const { v4: uuidv4 } = require("uuid");

exports.login = async (email, password) => {
    const existingUser = await userService.getOneByEmail(email);

    if (!existingUser) throw new Error("UnknownEmail");
    else if (existingUser.status !== "active") throw new Error("InactiveUser");
    else if (!(await bcrypt.compare(password, existingUser.password))) {
        throw new Error("IncorrectPassword");
    } else return getAccessAndRefreshTokens(existingUser);
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
        existingUser.modifiedOn = new Date();

        await userService.updateOne(existingUser);

        return getAccessAndRefreshTokens(existingUser);
    }
};

exports.signupByInvitationCode = async (firstName, lastName, password, invitationCode) => {
    const existingUser = await userService.getOneBySignupCode(invitationCode);
    if (existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);

        // update user info
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        // email is already saved
        existingUser.password = hashedPassword;
        existingUser.status = "active";
        existingUser.activatedOn = new Date();
        existingUser.emailVerified = true;
        existingUser.modifiedOn = new Date();

        await userService.updateOne(existingUser);

        return getAccessAndRefreshTokens(existingUser);
    } else throw new Error("InvalidInvitationCode");
};

exports.signupByUserRegistration = async (firstName, lastName, email, psw) => {
    const existingUser = await userService.getOneByEmail(email);
    if (existingUser && existingUser.status === "active") throw new Error("EmailAlreadyExists");

    const password = await bcrypt.hash(psw, 10);

    const uniqueId = existingUser && existingUser.signupCode ? existingUser.signupCode : uuidv4(); // keep the original code if exists

    if (existingUser) {
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.password = password;
        existingUser.status = "registered";
        existingUser.signupCode = uniqueId;
        existingUser.modifiedOn = new Date();

        await userService.updateOne(existingUser);
    } else {
        const newUser = {
            firstName,
            lastName,
            password,
            status: "registered",
            signupCode: uniqueId,
            createdOn: new Date(),
        };
        if (email) {
            newUser.email = email.toLowerCase(); // ensures that the email is saved in lowerCase
        }

        await userService.insertOne(newUser);
    }

    return uniqueId;
};

exports.saveResetPasswordRequest = async (email, password) => {
    const existingUser = await userService.getOneByEmail(email);
    if (!existingUser || (existingUser && existingUser.status !== "active")) throw new Error("AccountNotExists");

    const resetPasswordCode = uuidv4();

    existingUser.resetPasswordCode = resetPasswordCode;
    existingUser.resetPasswordInfo = {
        newPassword: await bcrypt.hash(password, 10),
        requestDate: new Date(),
    };
    existingUser.modifiedOn = new Date();

    await userService.updateOne(existingUser);

    return resetPasswordCode;
};

exports.signupByActivationCode = async (activationCode) => {
    const existingUser = await userService.getOneBySignupCode(activationCode);
    if (existingUser) {
        if (existingUser.status === "registered") {
            // update user info
            existingUser.status = "active";
            existingUser.activatedOn = new Date();
            existingUser.emailVerified = true;
            existingUser.modifiedOn = new Date();

            await userService.updateOne(existingUser);

            return getAccessAndRefreshTokens(existingUser);
        } else if (existingUser.status === "active") {
            throw new Error("AccountAlreadyActivated");
        } else throw new Error("InvalidActivationCode");
    } else throw new Error("InvalidActivationCode");
};

exports.resetPasswordByCode = async (resetPasswordCode) => {
    const existingUser = await userService.getOneByResetPasswordCode(resetPasswordCode);

    if (!existingUser) throw new Error("InvalidResetPasswordCode");
    else if (existingUser.status !== "active") throw new Error("InactiveUser");
    else if (!existingUser.resetPasswordInfo) throw new Error("InvalidResetPasswordInfo");

    // update user info
    const currentDate = new Date();

    const modifiedFields = {
        password: existingUser.resetPasswordInfo.newPassword,
        lastResetPasswordOn: currentDate,
        modifiedOn: currentDate,
    };

    const removedFields = {
        resetPasswordCode: "",
        resetPasswordInfo: "",
    };

    return await userService.resetPassword(existingUser._id, modifiedFields, removedFields);
};

exports.getJwtPayload = async (token) => {
    const payload = await jwt.verify(token, config.session_secret);
    return payload;
};

exports.getTokensFromRefreshToken = async (refreshToken) => {
    const payload = await jwt.verify(refreshToken, config.session_secret);
    const userId = payload.data._id;

    const existingUser = await userService.getOneById(userId);

    // TODO: check here for other conditions, as needed (eg: new roles/permissions)
    if (!existingUser || existingUser.status !== "active") throw new Error("InvalidUser");
    else return getAccessAndRefreshTokens(existingUser);
};

const generateJWT = (user) => {
    return jwt.sign(
        {
            data: {
                _id: user._id,
                email: user.email,
            },
        },
        config.session_secret,
        // { expiresIn: 60 * 60 * 24 * 365 } // in seconds
        // { expiresIn: "6h" }
        { expiresIn: config.loginJwtTokenExpiresIn }
    );
};

const generateJWTRefreshToken = (user) => {
    return jwt.sign(
        {
            data: {
                _id: user._id,
                // email: user.email
            },
        },
        // TODO: use a different key
        config.session_secret

        // refresh token doesn't expire
        // { expiresIn: config.loginJwtTokenExpiresIn }
    );
};

const getAccessAndRefreshTokens = (existingUser) => {
    const token = generateJWT(existingUser);
    const refreshToken = generateJWTRefreshToken(existingUser);
    return { token, refreshToken };
};
