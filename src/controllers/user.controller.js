const validator = require("validator");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const emailService = require("../services/email.service");
// const config = require("../config");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");
const uuid = require("uuid/v4");

exports.inviteToSignup = async (req, res) => {
    const { email, firstName, lastName, personId } = req.body;
    const existingUser = await userService.getOneByEmail(email);

    if (existingUser && existingUser.status === "active") {
        return res.send("Există deja un utilizator activ cu acest email");
    }
    //if (userRecord.status === "invited") return res.send("Există deja o invitație trimisă pe această adresă de email");
    const date = new Date();
    date.setDate(date.getDate() + 7); // expires after 1 week
    const uniqueId = uuid();
    if (existingUser) {
        existingUser.status = "invited";
        existingUser.invitationCode = uniqueId;
        existingUser.invitationExpTime = date;
        await userService.updateOne(existingUser);
    } else {
        const newUser = {
            firstName,
            lastName,
            email,
            emailVerified: false,
            personId,
            status: "invited",
            invitationCode: uniqueId,
            invitationExpTime: date
        };
        await userService.insertOne(newUser);
    }

    //const urlUniqueToken = authService.generateJwtForInviteToJoin(email);

    const data = {
        email,
        uniqueId
    };
    res.send(data);
    // res.redirect(req.get("referer"));
};

exports.checkSendEmail = async (req, res) => {
    const data = {
        to: "lucian.maran@outlook.com",
        subject: "Hello7",
        text: "Testing some Mailgun awesomness!"
    };

    try {
        const response = await emailService.sendEmail(data);
        return res.json(response);
    } catch (error) {
        return res.json(error.message);
    }
};

exports.getLogin = (req, res) => {
    if (req.user) return res.redirect("/"); // already authenticated

    // Get an array of flash errors (or initial values) by passing the key
    const validationErrors = req.flash("validationErrors");
    const initialValues = req.flash("initialValues");

    const errors = arrayHelper.arrayToObject(validationErrors, "field");
    const data = arrayHelper.arrayToObject(initialValues, "field");

    // set autofocus
    const uiData = {};
    if (validationErrors.length) {
        uiData[validationErrors[0].field] = { hasAutofocus: true }; // focus on first field with error
    } else {
        uiData.email = { hasAutofocus: true }; // in case of a new page
    }

    res.render("user/login", { data, uiData, errors });
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        // handle static validation errors
        const validationErrors = getLoginStaticValidationErrors(email, password);
        if (validationErrors.length) {
            return flashAndReloadLoginPage(req, res, validationErrors);
        }

        const token = await authService.login(email, password);

        cookieHelper.setCookies(res, token);
        res.redirect("/");
    } catch (err) {
        // handle dynamic validation errors
        const validationErrors = [];
        if (err.message === "UnknownEmail") {
            validationErrors.push({ field: "email", msg: "Email necunoscut" });
        } else if (err.message === "IncorrectPassword") {
            validationErrors.push({ field: "password", msg: "Parolă incorectă" });
        }

        if (validationErrors.length) {
            return flashAndReloadLoginPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err.message);
    }
};

exports.logout = (req, res) => {
    // // http://expressjs.com/api.html#res.clearCookie
    // //res.clearCookie('access_token', { path: '/' });
    // //res.clearCookie('user', { path: '/' });

    // const c1 = cookie.serialize("access_token", "", { path: "/", expires: new Date(1) });
    // const c2 = cookie.serialize("XSRF-TOKEN", "", { path: "/", expires: new Date(1) });
    // const c3 = cookie.serialize("user", "", { path: "/", expires: new Date(1) });

    // // http://www.connecto.io/blog/nodejs-express-how-to-set-multiple-cookies-in-the-same-response-object/
    // res.header("Set-Cookie", [c1, c2, c3]); // array of cookies http://expressjs.com/api.html#res.set

    cookieHelper.clearCookies(res);

    req.user = null;
    res.redirect("/");
};

exports.getSignup = async (req, res) => {
    if (req.user) return res.redirect("/"); // already authenticated
    const uiData = {};

    // Get an array of flash errors (or initial values) by passing the key
    const validationErrors = req.flash("validationErrors");
    const initialValues = req.flash("initialValues");

    const errors = arrayHelper.arrayToObject(validationErrors, "field");
    const data = arrayHelper.arrayToObject(initialValues, "field");

    // rely on invitation code only on first request
    if (validationErrors.length) {
        uiData[validationErrors[0].field] = { hasAutofocus: true }; // focus on first field with error
    } else {
        const invitationCode = req.query.invitationCode;
        if (invitationCode) {
            // console.log(invitationCode);
            const existingUser = await userService.getOneByInvitationCode(invitationCode);
            if (existingUser) {
                data.firstName = {
                    field: "firstName",
                    val: existingUser.firstName
                };
                data.lastName = {
                    field: "lastName",
                    val: existingUser.lastName
                };
                data.email = {
                    field: "email",
                    val: existingUser.email
                };

                uiData.password = { hasAutofocus: true };
            }
        } else {
            uiData.lastName = { hasAutofocus: true };
        }
    }

    if (req.query.invitationCode) {
        uiData.email = { isReadOnly: true };
    }

    // set autofocus

    // if (validationErrors.length) {
    //     uiData[validationErrors[0].field] = { hasAutofocus: true }; // focus on first field with error
    // } else {
    //     uiData.lastName = { hasAutofocus: true }; // in case of a new page
    // }

    //res.send(data);
    res.render("user/signup", { data, uiData, errors });
};

exports.postSignup = async function(req, res) {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        // handle static validation errors
        const validationErrors = getSignupStaticValidationErrors(firstName, lastName, email, password, confirmPassword);
        if (validationErrors.length) {
            return flashAndReloadSignupPage(req, res, validationErrors);
        }

        const token = await authService.signup(firstName, lastName, email, password, confirmPassword);

        cookieHelper.setCookies(res, token);

        res.redirect("/");
    } catch (err) {
        // handle dynamic validation errors

        const validationErrors = [];
        if (err.message === "EmailAlreadyExists") {
            validationErrors.push({ field: "email", msg: "Există deja un cont cu acest email" });
        }

        if (validationErrors.length) {
            return flashAndReloadSignupPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err);
    }
};

/**
 * Get a single user
 */
exports.getById = function(req, res, next) {
    const userId = req.params.id;

    userService.getByIdWithoutPsw(userId, function(err, user) {
        if (err) return next(err);
        if (!user) return res.status(401).send("Unauthorized");
        res.json(user);
    });
};

/**
 * Change a users password
 */
exports.getChangePassword = async (req, res) => {
    // if (req.user) return res.redirect("/"); // already authenticated

    let data = {};
    const errors = req.flash("validationErrors"); // Get an array of flash messages by passing the key

    if (errors.length) {
        // redirect from POST (with errors)
        data = arrayHelper.arrayToObject(errors, "field");
    } else {
        // clean, new page
        data.email = { hasAutofocus: true };
    }
    res.render("user/changePassword", { data, errors });
};

exports.postChangePassword = async (req, res) => {
    // const userId = String(req.user._id); //without 'String' the result is an Object
    const oldPassword = String(req.body.oldPassword);
    const newPassword = String(req.body.newPassword);

    const validationErrors = [];

    if (validator.isEmpty(oldPassword)) validationErrors.push({ field: "oldPassword", msg: "Câmp obligatoriu" });
    if (!validator.isLength(oldPassword, { max: 50 }))
        validationErrors.push({ field: "oldPassword", msg: "Maxim 50 caractere" });

    if (validator.isEmpty(newPassword)) validationErrors.push({ field: "newPassword", msg: "Câmp obligatoriu" });
    if (!validator.isLength(newPassword, { max: 50 }))
        validationErrors.push({ field: "newPassword", msg: "Câmp obligatoriu" });

    if (validationErrors.length) {
        req.flash("validationErrors", validationErrors);
        return res.redirect("/changepassword");
    }

    try {
        // const { user, token } = await authService.login(email, password);
        // // return res
        // //     .status(200)
        // //     .json({ user, token })
        // //     .end();
        // cookieHelper.setCookies(res, token, user);
        res.redirect("/");
    } catch (error) {
        // const validationErrors = [
        //     { field: "email", val: email },
        //     { field: "password", msg: error.message }
        // ];
        // req.flash("validationErrors", validationErrors);
        return res.redirect("/changepassword");
        // return res.status(401).json(error.message);
    }
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
    const userId = req.user._id.toString();
    userService.getByIdWithoutPsw(userId, function(err, user) {
        // don't ever give out the password or salt
        if (err) return next(err);
        if (!user) return res.status(401).send("Unauthorized");
        res.json(user);
    });
};

exports.saveActivationData = function(req, res) {
    const userId = req.params.id;
    const psw = req.body.password;

    userService.getOneById(userId, function(err, user) {
        user.salt = userService.makeSalt();
        user.hashedPassword = userService.encryptPassword(psw, user.salt);
        delete user.activationToken;

        user.modifiedBy = user.name;
        user.modifiedOn = new Date();

        userService.update(user, function(err) {
            if (err) return res.status(422).json(err);

            // keep user as authenticated
            const token = "signToken(user._id, user.role)";

            cookieHelper.setCookies(res, token);

            res.redirect("/");
        });
    });
};

exports.activateUser = function(req, res, next) {
    const userId = req.params.id;
    const activationToken = req.query.activationToken;

    userService.getByIdWithoutPsw(userId, function(err, user) {
        if (err) return next(err);
        if (!user) return res.status(400).send("Link incorect sau expirat (utilizator negasit)");
        if (user.activationToken !== activationToken) return res.status(400).send("Acest cont a fost deja activat");

        const context = {
            user: user
        };
        res.render("user/activate", context);
    });
};

const getSignupStaticValidationErrors = (firstName, lastName, email, password, confirmPassword) => {
    try {
        const validationErrors = [];

        // firstName
        if (validator.isEmpty(firstName)) validationErrors.push({ field: "firstName", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(firstName, { max: 50 }))
            validationErrors.push({ field: "firstName", msg: "Maxim 50 caractere" });

        // lastName
        if (validator.isEmpty(lastName)) validationErrors.push({ field: "lastName", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(lastName, { max: 50 }))
            validationErrors.push({ field: "lastName", msg: "Maxim 50 caractere" });

        if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(email, { max: 50 }))
            validationErrors.push({ field: "email", msg: "Maxim 50 caractere" });
        else if (!validator.isEmail(email)) validationErrors.push({ field: "email", msg: "Email invalid" });
        // else if (await userService.getOneByEmail(email))
        //     validationErrors.push({ field: "email", msg: "Exista deja un cont cu acest email" });

        // password
        if (validator.isEmpty(password)) validationErrors.push({ field: "password", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(password, { min: 6 }))
            validationErrors.push({ field: "password", msg: "Minim 6 caractere" });
        else if (!validator.isLength(password, { max: 50 }))
            validationErrors.push({ field: "password", msg: "Maxim 50 caractere" });

        // confirm password
        if (validator.isEmpty(confirmPassword))
            validationErrors.push({ field: "confirmPassword", msg: "Câmp obligatoriu" });
        else if (confirmPassword !== password)
            validationErrors.push({ field: "confirmPassword", msg: "Parolele nu coincid" });

        return validationErrors;
    } catch (err) {
        throw new Error(err);
    }
};

const getLoginStaticValidationErrors = (email, password) => {
    const validationErrors = [];

    // email
    if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu" });
    else if (!validator.isLength(email, { max: 50 }))
        validationErrors.push({ field: "email", msg: "Maxim 50 caractere" });

    // password
    if (validator.isEmpty(password)) validationErrors.push({ field: "password", msg: "Câmp obligatoriu" });
    else if (!validator.isLength(password, { max: 50 }))
        validationErrors.push({ field: "password", msg: "Maxim 50 caractere" });

    return validationErrors;
};

const flashAndReloadSignupPage = (req, res, validationErrors) => {
    const { lastName, firstName, email, password, confirmPassword } = req.body;
    const initialValues = [
        { field: "lastName", val: lastName },
        { field: "firstName", val: firstName },
        { field: "email", val: email },
        { field: "password", val: password },
        { field: "confirmPassword", val: confirmPassword }
    ];
    // keep old values at page reload by setting a flash message (a key, followed by a value)
    req.flash("validationErrors", validationErrors);
    req.flash("initialValues", initialValues);
    const currentUrl = req.get("referer"); // "/signup?invitationCode=..."
    return res.redirect(currentUrl);
};

const flashAndReloadLoginPage = (req, res, validationErrors) => {
    const { email, password } = req.body;
    const initialValues = [
        { field: "email", val: email },
        { field: "password", val: password }
    ];
    req.flash("validationErrors", validationErrors);
    req.flash("initialValues", initialValues);
    return res.redirect("/login");
};
