const jwt = require("jsonwebtoken");
const validator = require("validator");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const emailService = require("../services/email.service");
const config = require("../config");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");

const validationError = function(res, err) {
    return res.status(422).json(err);
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
        const validationErrors = await getLoginValidationErrors(email, password);

        if (validationErrors.length) {
            const initialValues = [{ field: "email", val: email }]; // keep old values at page reload

            req.flash("validationErrors", validationErrors);
            req.flash("initialValues", initialValues);

            return res.redirect("/login");
        }

        // we expect here that the user exists and the psw is correct
        const userRecord = await userService.getOneByEmail(email.toLowerCase());
        const token = authService.generateJWT(userRecord);

        cookieHelper.setCookies(res, token);
        res.redirect("/");
    } catch (error) {
        // @TODO display an error message (without details) and log the details
        return res.status(500).json(error.message);
    }
};

const getLoginValidationErrors = async (email, password) => {
    try {
        const validationErrors = [];

        // email
        if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu." });
        else if (!validator.isLength(email, { max: 50 }))
            validationErrors.push({ field: "email", msg: "Maxim 50 caractere" });

        // password
        if (validator.isEmpty(password)) validationErrors.push({ field: "password", msg: "Câmp obligatoriu." });
        else if (!validator.isLength(password, { max: 50 }))
            validationErrors.push({ field: "password", msg: "Maxim 50 caractere" });

        // credentials (email and password)
        const emailAndPasswordAreValid = !validationErrors.find(x => x.field === "email" || x.field === "password");
        if (emailAndPasswordAreValid) {
            const userRecord = await userService.getOneByEmail(email.toLowerCase());
            if (!userRecord) {
                validationErrors.push({ field: "email", msg: "Email necunoscut" });
            } else {
                if (!(await authService.matchPassword(password, userRecord.password))) {
                    validationErrors.push({ field: "password", msg: "Parolă incorectă" });
                }
            }
        }
        return validationErrors;
    } catch (error) {
        throw new Error(error.message); // re-throw the error
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

exports.getSignup = (req, res) => {
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

    res.render("user/signup", { data, uiData, errors });
};

exports.postSignup = async function(req, res) {
    try {
        const validationErrors = await getSignupValidationErrors(req.body);

        const { email, password } = req.body;

        if (validationErrors.length) {
            // keep old values at page reload
            const initialValues = [
                { field: "email", val: email },
                { field: "password", val: password }
            ];

            req.flash("validationErrors", validationErrors); // Set a flash message by passing the key, followed by the value
            req.flash("initialValues", initialValues);

            return res.redirect("/signup");
        }

        const firstName = "My First Name";
        const lastName = "My Last Name";

        const hashedPassword = await authService.getHashedPassword(password);

        const response = await userService.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdOn: new Date()
        });

        const userRecord = response.ops[0];
        const token = authService.generateJWT(userRecord);

        cookieHelper.setCookies(res, token);
        res.redirect("/");
    } catch (error) {
        // @TODO display an error message (without details) and log the details
        return res.status(500).json(error.message);
    }
};

const getSignupValidationErrors = async body => {
    try {
        const { email, password, confirmPassword } = body;
        const validationErrors = [];

        // email
        if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu." });
        else if (!validator.isLength(email, { max: 50 }))
            validationErrors.push({ field: "email", msg: "Maxim 50 caractere." });
        else if (!validator.isEmail(email)) validationErrors.push({ field: "email", msg: "Email invalid." });
        else if (await userService.getOneByEmail(email))
            validationErrors.push({ field: "email", msg: "Exista deja un cont cu acest email." });

        // password
        if (validator.isEmpty(password)) validationErrors.push({ field: "password", msg: "Câmp obligatoriu." });
        else if (!validator.isLength(password, { min: 6 }))
            validationErrors.push({ field: "password", msg: "Minim 6 caractere." });
        else if (!validator.isLength(password, { max: 50 }))
            validationErrors.push({ field: "password", msg: "Maxim 50 caractere." });

        // confirm password
        if (validator.isEmpty(confirmPassword))
            validationErrors.push({ field: "confirmPassword", msg: "Câmp obligatoriu." });
        else if (confirmPassword !== password)
            validationErrors.push({ field: "confirmPassword", msg: "Parolele nu coincid." });

        return validationErrors;
    } catch (error) {
        throw new Error(error.message); // re-throw the error
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

exports.update = function(req, res) {
    const user = req.body;

    user.modifiedBy = req.user.name;
    user.modifiedOn = new Date();
    if (user.email) {
        user.email = user.email.toLowerCase();
    }

    userService.updatePartial(user, function(err, response) {
        // replacing the entire object will delete the psw+salt
        if (err) {
            return handleError(res, err);
        }
        if (!response.value) {
            res.sendStatus(404); // not found
        } else {
            res.sendStatus(200);
        }
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.remove = function(req, res) {
    const id = req.params.id;
    userService.remove(id, function(err) {
        if (err) {
            return handleError(res, err);
        }
        res.sendStatus(204);
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

    // const user = await userService.getOneById(userId);

    // const email = req.body.email;
    // const password = req.body.password;

    const validationErrors = [];

    if (validator.isEmpty(oldPassword)) validationErrors.push({ field: "oldPassword", msg: "Câmp obligatoriu." });
    if (!validator.isLength(oldPassword, { max: 50 }))
        validationErrors.push({ field: "oldPassword", msg: "Maxim 50 caractere." });

    if (validator.isEmpty(newPassword)) validationErrors.push({ field: "newPassword", msg: "Câmp obligatoriu." });
    if (!validator.isLength(newPassword, { max: 50 }))
        validationErrors.push({ field: "newPassword", msg: "Câmp obligatoriu." });

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

/**
 * Authentication callback
 */
exports.authCallback = function(req, res) {
    res.redirect("/");
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
            if (err) return validationError(res, err);

            // keep user as authenticated
            const token = signToken(user._id, user.role);

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
        if (!user) return res.status(400).send("Link incorect sau expirat (utilizator negasit).");
        if (user.activationToken !== activationToken) return res.status(400).send("Acest cont a fost deja activat.");

        const context = {
            user: user
        };
        res.render("user/activate", context);
    });
};

exports.checkEmail = function(req, res) {
    const email = req.params.email;

    userService.getByValue("email", email, null, function(err, user) {
        if (err) {
            return handleError(res, err);
        }

        if (user) {
            res.send(true);
        } else {
            res.send(false);
        }
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
    return jwt.sign({ _id: id }, config.session_secret, { expiresIn: 60 * 60 * 24 * 365 }); // in seconds
}
