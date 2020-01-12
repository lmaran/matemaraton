const validator = require("validator");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const emailService = require("../services/email.service");
const config = require("../config");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");
const uuid = require("uuid/v4");

exports.postInviteToSignup = async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        const existingUser = await userService.getOneByEmail(email);

        if (existingUser && existingUser.status === "active") {
            return res.send("Există deja un utilizator activ cu acest email");
        }

        const uniqueId = existingUser && existingUser.signupCode ? existingUser.signupCode : uuid(); // keep the original code if exists

        const invitationInfo = {
            firstName,
            lastName
        };

        if (existingUser) {
            existingUser.invitationInfo = invitationInfo;
            existingUser.status = "invited";
            existingUser.signupCode = uniqueId;

            await userService.updateOne(existingUser);
        } else {
            const newUser = {
                invitationInfo,
                status: "invited",
                signupCode: uniqueId,
                email
            };
            await userService.insertOne(newUser);
        }

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

        res.redirect("/signup/invitation-sent");
    } catch (err) {
        return res.json(err.message);
    }
};

exports.getSignup = async (req, res) => {
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
            const { token, refreshToken } = await authService.signupByInvitationCode(
                firstName,
                lastName,
                // email,
                password,
                invitationCode
            );

            cookieHelper.setCookies(res, token, refreshToken);

            res.redirect("/signup/confirm-invitation-done");
        } else {
            const activationCode = await authService.signupByUserRegistration(firstName, lastName, email, password);
            // Send this code on email
            const rootUrl = config.externalUrl; // e.g. http://localhost:1417
            const link = `${rootUrl}/signup/confirm/${activationCode}`;

            const data = {
                to: email,
                subject: "Activare cont",
                html: `<html>Pentru activarea contului te rugăm să accesezi 
                <a href="${link}">link-ul de activare</a>!
                </html>`
            };

            await emailService.sendEmail(data);

            res.redirect("/signup/ask-to-confirm");
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

exports.getSignupConfirm = async (req, res) => {
    try {
        const activationCode = req.params.activationCode;

        const { token, refreshToken } = await authService.signupByActivationCode(activationCode);

        cookieHelper.setCookies(res, token, refreshToken);

        const data = {
            isSuccess: true,
            message: "Contul a fost <strong>activat</strong> cu success!",
            details: "Poți continua cu <a href='/'>pagina principală</a>."
        };

        res.render("user/signup-confirm", data);
    } catch (err) {
        const data = { isError: true, message: err.message };

        if (err.message === "AccountAlreadyActivated") {
            // res.redirect("/signup-registration-already-activated");
            data.message = "Acest cont a fost deja <strong>activat</strong>!";
            data.details = "Poți continua cu pagina de <a href='/login'>login</a>.";
        }

        res.render("user/reset-password-confirm", data);
    }
};

exports.displaySignupAskToConfirm = async (req, res) => {
    res.render("user/signup-ask-to-confirm");
};

exports.displaySignupInvitationSent = async (req, res) => {
    res.render("user/signup-invitation-sent");
};

exports.getSignupConfirmInvitationDone = async (req, res) => {
    const data = {
        isSuccess: true,
        message: "Contul a fost <strong>activat</strong> cu success!",
        details: "Poți continua cu <a href='/'>pagina principală</a>."
    };
    res.render("user/signup-confirm", data);
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
