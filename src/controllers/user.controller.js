const validator = require("validator");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const emailService = require("../services/email.service");
const config = require("../config");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");
const uuid = require("uuid/v4");

exports.inviteToSignup = async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        const existingUser = await userService.getOneByEmail(email);

        if (existingUser && existingUser.status === "active") {
            return res.send("Există deja un utilizator activ cu acest email");
        }
        // const expTime = new Date();
        // expTime.setDate(expTime.getDate() + 7); // expires after 1 week
        const uniqueId = existingUser && existingUser.signupCode ? existingUser.signupCode : uuid(); // keep the original code if exists

        const invitationInfo = {
            firstName,
            lastName
        };

        if (existingUser) {
            existingUser.invitationInfo = invitationInfo;
            existingUser.status = "invited";
            existingUser.signupCode = uniqueId;

            //existingUser.invitationExpTime = expTime;
            await userService.updateOne(existingUser);
        } else {
            const newUser = {
                invitationInfo,
                status: "invited",
                signupCode: uniqueId,
                email
                //invitationExpTime: expTime
            };
            await userService.insertOne(newUser);
        }
        //const urlUniqueToken = authService.generateJwtForInviteToJoin(email);

        // TODO: send invitation link on email

        // Send this code on email
        const rootUrl = config.externalUrl; // e.g. http://localhost:1417
        const link = `${rootUrl}/signup?invitationCode=${uniqueId}`;

        const emailData = {
            to: email,
            subject: "Invitație activare cont",
            html: `<html>Pentru activarea contului te rugăm să accesezi 
                <a href="${link}">link-ul de activare</a>!
                </html>`
        };

        await emailService.sendEmail(emailData);

        // const data = {
        //     email,
        //     uniqueId
        // };
        // res.send(data);
        // res.redirect(req.get("referer"));s
        res.redirect("/signup-invitation-sent");
    } catch (err) {
        return res.json(err.message);
    }
};

exports.checkSendEmail = async (req, res) => {
    const data = {
        to: "lucian.maran@outlook.com",
        subject: "Hello7",
        // text: "Testing some Mailgun awesomness!",
        html: "<html>HTML version of the body</html>"
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

exports.getInviteConfirm = async (req, res) => {
    // if (req.user) return res.redirect("/"); // already authenticated
    // const { userId, invitationCode } = req.params;

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

    res.render("user/invite-confirm", { data, uiData, errors });
};

exports.getSignup = async (req, res) => {
    // if (req.user) return res.redirect("/"); // already authenticated

    const invitationCode = req.query.invitationCode;
    let isInvitationCodeValid = false;
    const uiData = {};

    // Get an array of flash errors (or initial values) by passing the key
    const validationErrors = req.flash("validationErrors");
    const initialValues = req.flash("initialValues");

    const errors = arrayHelper.arrayToObject(validationErrors, "field");
    const data = arrayHelper.arrayToObject(initialValues, "field");

    const existingUser = invitationCode && (await userService.getOneBySignupCode(invitationCode));
    if (existingUser) {
        if (existingUser.status === "active") {
            return res.render("user/signup-invitation-already-accepted", { isNotAuthenticated: !req.user });
        }

        isInvitationCodeValid = true;

        // populate initial values from DB
        if (initialValues.length === 0 && existingUser.invitationInfo) {
            data.firstName = {
                field: "firstName",
                val: existingUser.invitationInfo.firstName
            };
            data.lastName = {
                field: "lastName",
                val: existingUser.invitationInfo.lastName
            };
            data.email = {
                field: "email",
                val: existingUser.email
            };
        }
    }

    // set autofocus properties
    if (validationErrors.length) {
        uiData[validationErrors[0].field] = { hasAutofocus: true }; // focus on first field with error
    } else {
        // no errors (e.g. first page request)s
        if (isInvitationCodeValid) {
            uiData.password = { hasAutofocus: true };
        } else {
            uiData.lastName = { hasAutofocus: true };
        }
    }

    // set readOnly properties
    if (isInvitationCodeValid) {
        uiData.email = { isReadOnly: true };
    }

    // save invitationCode into an hidden field to be sent at POST
    if (isInvitationCodeValid) {
        data.invitationCode = invitationCode;
    }

    //res.send(errors);
    res.render("user/signup", { data, uiData, errors });
};

exports.postSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, invitationCode } = req.body;

        // handle static validation errors
        const validationErrors = getSignupStaticValidationErrors(firstName, lastName, email, password, confirmPassword);
        if (validationErrors.length) {
            return flashAndReloadSignupPage(req, res, validationErrors);
        }

        if (invitationCode) {
            const token = await authService.signupByInvitationCode(
                firstName,
                lastName,
                // email,
                password,
                invitationCode
            );

            cookieHelper.setCookies(res, token);

            res.redirect("signup-completed");
        } else {
            const activationCode = await authService.signupByUserRegistration(firstName, lastName, email, password);
            // Send this code on email
            const rootUrl = config.externalUrl; // e.g. http://localhost:1417
            const link = `${rootUrl}/signup-activation/${activationCode}`;

            const data = {
                to: email,
                subject: "Activare cont",
                html: `<html>Pentru activarea contului te rugăm să accesezi 
                <a href="${link}">link-ul de activare</a>!
                </html>`
            };

            await emailService.sendEmail(data);

            res.redirect("signup-ask-to-complete");
        }
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
        return res.status(500).json(err.message);
    }
};

exports.signupActivation = async (req, res) => {
    try {
        const activationCode = req.params.activationCode;
        // console.log(activationCode);
        const token = await authService.signupByActivationCode(activationCode);

        cookieHelper.setCookies(res, token);

        res.redirect("signup-completed");
    } catch (err) {
        if (err.message === "AccountAlreadyActivated") {
            res.redirect("/signup-registration-already-activated");
        } else {
            return res.status(500).json(err.message);
        }
    }
};

exports.signupCompleted = async (req, res) => {
    res.render("user/signup-completed");
};

exports.askToComplete = async (req, res) => {
    res.render("user/signup-ask-to-complete");
};

exports.signupInvitationSent = async (req, res) => {
    res.render("user/signup-invitation-sent");
};

exports.signupRegistrationAlreadyActivated = async (req, res) => {
    res.render("user/signup-registration-already-activated", { isNotAuthenticated: !req.user });
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

exports.getChangePassword = async (req, res) => {
    // the "isAuthenticated" middleware ensure us that only authenticated users can call this method

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
        uiData.oldPassword = { hasAutofocus: true }; // in case of a new page
    }
    //res.send({ data, uiData, errors });
    res.render("user/change-password", { data, uiData, errors });
};

exports.postChangePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        // handle static validation errors
        const validationErrors = getChangePasswordStaticValidationErrors(oldPassword, newPassword);

        if (validationErrors.length) {
            return flashAndReloadChangePasswordPage(req, res, validationErrors);
        }

        const token = await authService.changePassword(req.user.email, oldPassword, newPassword);

        cookieHelper.setCookies(res, token);
        res.redirect("/");
    } catch (err) {
        // handle dynamic validation errors
        const validationErrors = [];
        if (err.message === "UnknownEmail") {
            validationErrors.push({ field: "oldPassword", msg: "Utilizator necunoscut" });
        } else if (err.message === "IncorrectPassword") {
            validationErrors.push({ field: "oldPassword", msg: "Parolă incorectă" });
        }

        if (validationErrors.length) {
            return flashAndReloadChangePasswordPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err.message);
    }
};

exports.getResetPassword = async (req, res) => {
    try {
        const uiData = {};

        // Get an array of flash errors (or initial values) by passing the key
        const validationErrors = req.flash("validationErrors");
        const initialValues = req.flash("initialValues");

        const errors = arrayHelper.arrayToObject(validationErrors, "field");
        const data = arrayHelper.arrayToObject(initialValues, "field");

        // if authenticate,fill in the email field
        if (req.user) {
            data.email = {
                field: "email",
                val: req.user.email
            };
        }

        // set autofocus properties
        if (validationErrors.length) {
            uiData[validationErrors[0].field] = { hasAutofocus: true }; // focus on first field with error
        } else {
            // no errors (e.g. first page request)
            if (req.user) {
                uiData.password = { hasAutofocus: true };
            } else {
                uiData.email = { hasAutofocus: true };
            }
        }

        // set readOnly properties
        if (req.user) {
            uiData.email = { isReadOnly: true };
        }

        res.render("user/reset-password", { data, uiData, errors });
    } catch (err) {
        return res.status(200).json(err.message);
    }
};

exports.postResetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        // handle static validation errors
        const validationErrors = getResetPasswordStaticValidationErrors(email, password, confirmPassword);
        if (validationErrors.length) {
            return flashAndReloadSignupPage(req, res, validationErrors);
        }

        const resetPasswordCode = await authService.saveResetPasswordRequest(email, password);

        // Send this code on email
        const rootUrl = config.externalUrl; // e.g. http://localhost:1417
        const link = `${rootUrl}/reset-password/confirm/${resetPasswordCode}`;
        const data = {
            to: email,
            subject: "Resetare parolă",
            html: `<html>Te rugăm să confirmi operația de resetare a parolei folosind acest <a href="${link}">link</a>!</html>`
        };
        await emailService.sendEmail(data);

        res.redirect("/reset-password/ask-to-confirm");
    } catch (err) {
        // handle dynamic validation errors
        const validationErrors = [];
        if (err.message === "AccountNotExists") {
            validationErrors.push({ field: "email", msg: "Nu există un cont activ cu acest email" });
        }

        if (validationErrors.length) {
            return flashAndReloadSignupPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err.message);
    }
};

exports.resetPasswordAskToConfirm = async (req, res) => {
    res.render("user/reset-password-ask-to-confirm");
};

exports.resetPasswordConfirm = async (req, res) => {
    try {
        const resetPasswordCode = req.params.resetPasswordCode;

        await authService.resetPasswordByCode(resetPasswordCode);

        cookieHelper.clearCookies(res);

        const data = {
            isSuccess: true,
            message: "Parola a fost <strong>resetată</strong> cu success!",
            details: "Poți continua cu pagina de <a href='/login'>login</a>."
        };

        res.render("user/reset-password-confirm", data);
    } catch (err) {
        const data = { isError: true, message: err.message };

        if (err.message === "InvalidResetPasswordCode")
            data.message = "Codul pentru resetarea parolei este <strong>invalid</strong> sau <strong>expirat</strong>!";
        else if (err.message === "InactiveUser") data.message = "Utilizatorul aferent acestui cod este inactiv!";
        else if (err.message === "InvalideResetPasswordInfo")
            data.message = "Lipsesc informațiile necesare pentru resetarea parolei!";

        res.render("user/reset-password-confirm", data);
    }
};

exports.resetPasswordConfirmed = async (req, res) => {
    res.render("user/reset-password-confirmed");
};

exports.me = function(req, res, next) {
    const userId = req.user._id.toString();
    userService.getByIdWithoutPsw(userId, function(err, user) {
        // don't ever give out the password or salt
        if (err) return next(err);
        if (!user) return res.status(401).send("Unauthorized");
        res.json(user);
    });
};

const getSignupStaticValidationErrors = (firstName, lastName, email, password, confirmPassword) => {
    try {
        const validationErrors = [];

        // lastName
        if (validator.isEmpty(lastName)) validationErrors.push({ field: "lastName", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(lastName, { max: 50 }))
            validationErrors.push({ field: "lastName", msg: "Maxim 50 caractere" });

        // firstName
        if (validator.isEmpty(firstName)) validationErrors.push({ field: "firstName", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(firstName, { max: 50 }))
            validationErrors.push({ field: "firstName", msg: "Maxim 50 caractere" });

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

const getResetPasswordStaticValidationErrors = (email, password, confirmPassword) => {
    try {
        const validationErrors = [];

        if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu" });
        else if (!validator.isLength(email, { max: 50 }))
            validationErrors.push({ field: "email", msg: "Maxim 50 caractere" });
        else if (!validator.isEmail(email)) validationErrors.push({ field: "email", msg: "Email invalid" });

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

const getChangePasswordStaticValidationErrors = (oldPassword, newPassword) => {
    const validationErrors = [];

    // oldPassword
    if (validator.isEmpty(oldPassword)) validationErrors.push({ field: "oldPassword", msg: "Câmp obligatoriu" });
    else if (!validator.isLength(oldPassword, { max: 50 }))
        validationErrors.push({ field: "oldPassword", msg: "Maxim 50 caractere" });

    // newPassword
    if (validator.isEmpty(newPassword)) validationErrors.push({ field: "newPassword", msg: "Câmp obligatoriu" });
    else if (!validator.isLength(newPassword, { min: 6 }))
        validationErrors.push({ field: "newPassword", msg: "Minim 6 caractere" });
    else if (!validator.isLength(newPassword, { max: 50 }))
        validationErrors.push({ field: "newPassword", msg: "Câmp obligatoriu" });

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

const flashAndReloadChangePasswordPage = (req, res, validationErrors) => {
    const { oldPassword, newPassword } = req.body;
    const initialValues = [
        { field: "oldPassword", val: oldPassword },
        { field: "newPassword", val: newPassword }
    ];
    req.flash("validationErrors", validationErrors);
    req.flash("initialValues", initialValues);
    return res.redirect("/change-password");
};
