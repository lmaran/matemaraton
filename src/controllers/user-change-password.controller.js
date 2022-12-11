const validator = require("validator");
const authService = require("../services/auth.service");
// const emailService = require("../services/email.service");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");

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
        const validationErrors = getChangePasswordStaticValidationErrors(
            oldPassword,
            newPassword
        );

        if (validationErrors.length) {
            return flashAndReloadChangePasswordPage(req, res, validationErrors);
        }

        const { token, refreshToken } = await authService.changePassword(
            req.user.email,
            oldPassword,
            newPassword
        );

        cookieHelper.setCookies(res, token, refreshToken);
        res.redirect("/");
    } catch (err) {
        // handle dynamic validation errors
        const validationErrors = [];
        if (err.message === "UnknownEmail") {
            validationErrors.push({
                field: "oldPassword",
                msg: "Utilizator necunoscut",
            });
        } else if (err.message === "IncorrectPassword") {
            validationErrors.push({
                field: "oldPassword",
                msg: "Parolă incorectă",
            });
        }

        if (validationErrors.length) {
            return flashAndReloadChangePasswordPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err.message);
    }
};

const getChangePasswordStaticValidationErrors = (oldPassword, newPassword) => {
    const validationErrors = [];

    // oldPassword
    if (validator.isEmpty(oldPassword))
        validationErrors.push({
            field: "oldPassword",
            msg: "Câmp obligatoriu",
        });
    else if (!validator.isLength(oldPassword, { max: 50 }))
        validationErrors.push({
            field: "oldPassword",
            msg: "Maxim 50 caractere",
        });

    // newPassword
    if (validator.isEmpty(newPassword))
        validationErrors.push({
            field: "newPassword",
            msg: "Câmp obligatoriu",
        });
    else if (!validator.isLength(newPassword, { min: 6 }))
        validationErrors.push({
            field: "newPassword",
            msg: "Minim 6 caractere",
        });
    else if (!validator.isLength(newPassword, { max: 50 }))
        validationErrors.push({
            field: "newPassword",
            msg: "Câmp obligatoriu",
        });

    return validationErrors;
};

const flashAndReloadChangePasswordPage = (req, res, validationErrors) => {
    const { oldPassword, newPassword } = req.body;
    const initialValues = [
        { field: "oldPassword", val: oldPassword },
        { field: "newPassword", val: newPassword },
    ];
    req.flash("validationErrors", validationErrors);
    req.flash("initialValues", initialValues);
    return res.redirect("/change-password");
};
