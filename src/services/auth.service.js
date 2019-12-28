const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");
const userService = require("../services/user.service");

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

exports.signup = async (email, password) => {
    if (await userService.getOneByEmail(email)) throw new Error("EmailAlreadyExists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await userService.create({
        firstName: "My First Name",
        lastName: "My Last Name",
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
