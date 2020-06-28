const validator = require("validator");
const authService = require("../services/auth.service");
const emailService = require("../services/email.service");
const config = require("../config");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");

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
            return flashAndReloadResetPasswordPage(req, res, validationErrors);
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
            return flashAndReloadResetPasswordPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err.message);
    }
};

exports.displayResetPasswordAskToConfirm = async (req, res) => {
    res.render("user/reset-password-ask-to-confirm");
};

exports.getResetPasswordConfirm = async (req, res) => {
    try {
        const resetPasswordCode = req.params.resetPasswordCode;

        await authService.resetPasswordByCode(resetPasswordCode);

        cookieHelper.clearCookies(res);

        res.redirect("/reset-password/confirm-success");
    } catch (err) {
        const data = { message: err.message };

        if (err.message === "InvalidResetPasswordCode")
            data.message = "Codul pentru resetarea parolei este <strong>invalid</strong> sau <strong>expirat</strong>!";
        else if (err.message === "InactiveUser") data.message = "Utilizatorul aferent acestui cod este inactiv!";
        else if (err.message === "InvalidResetPasswordInfo")
            data.message = "Lipsesc informațiile necesare pentru resetarea parolei!";

        res.render("user/reset-password-confirm-error", data);
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

const flashAndReloadResetPasswordPage = (req, res, validationErrors) => {
    const { email, password, confirmPassword } = req.body;
    const initialValues = [
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

exports.getResetPasswordConfirmSuccess = async (req, res) => {
    const data = {
        userIsNotAuthenticated: !req.user
    };
    res.render("user/reset-password-confirm-success", data);
};
