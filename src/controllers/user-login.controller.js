const validator = require("validator");
const authService = require("../services/auth.service");
const arrayHelper = require("../helpers/array.helper");
const cookieHelper = require("../helpers/cookie.helper");

exports.getLogin = (req, res) => {
    if (req.user) {
        const data = {
            isInfo: true,
            message: "Ești deja autentificat!",
            details: "Dacă dorești să te re-autentifici, trebuie întâi să te deconectezi: <a href='/logout'>logout</a>."
        };
        return res.render("user/login-response", data);
    }

    // Get an array of flash errors (or initial values) by passing the key
    const validationErrors = req.flash("validationErrors");
    const initialValues = req.flash("initialValues");

    const errors = arrayHelper.arrayToObject(validationErrors, "field");
    const data = arrayHelper.arrayToObject(initialValues, "field");

    // save into an hidden field to be sent at POST
    data.redirectUri = req.query.redirect_uri;

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
        const { email, password, redirectUri } = req.body;
        // handle static validation errors
        const validationErrors = getLoginStaticValidationErrors(email, password);
        if (validationErrors.length) {
            return flashAndReloadLoginPage(req, res, validationErrors);
        }

        const { token, refreshToken } = await authService.login(email, password);

        cookieHelper.setCookies(res, token, refreshToken);
        res.redirect(redirectUri || "/");
    } catch (err) {
        // handle dynamic validation errors
        const validationErrors = [];
        if (err.message === "UnknownEmail") {
            validationErrors.push({ field: "email", msg: "Email necunoscut" });
        } else if (err.message === "IncorrectPassword") {
            validationErrors.push({ field: "password", msg: "Parolă incorectă" });
        } else if (err.message === "InactiveUser") {
            validationErrors.push({ field: "email", msg: "Utilizator inactiv" });
        }

        if (validationErrors.length) {
            return flashAndReloadLoginPage(req, res, validationErrors);
        }

        // @TODO display an error message (without details) and log the details
        return res.status(500).json(err.message);
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
