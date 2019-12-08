const cookie = require("cookie");

const jwt = require("jsonwebtoken");
const validator = require("validator");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const config = require("../config");
const arrayHelper = require("../helpers/array.helper");

const validationError = function(res, err) {
    return res.status(422).json(err);
};

exports.getLogin = (req, res) => {
    if (req.user) return res.redirect("/"); // already authenticated

    let data = {};
    const errors = req.flash("validationErrors");

    if (errors.length) {
        // redirect from POST (with errors)
        data = arrayHelper.arrayToObject(errors, "field");
        if (data.email && data.email.msg) data.email.hasAutofocus = true;
        else data.password.hasAutofocus = true;
    } else {
        // clean, new page
        data.email = { hasAutofocus: true };
    }

    res.render("user/login", { data, errors });
};

exports.postLogin = async (req, res) => {
    // console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;

    const validationErrors = [];

    // const [emailMsg, passwordMsg, confirmPasswordMsg] = await Promise.all([
    //     await getEmailError(email)
    //     // await getPasswordError(password),
    //     // await getConfirmPasswordError(password, confirmPassword)
    // ]);

    //if (emailMsg) validationErrors.push({ field: "email", msg: emailMsg });

    if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu." });
    if (!validator.isLength(email, { max: 50 })) validationErrors.push({ field: "email", msg: "Maxim 50 caractere." });

    if (validator.isEmpty(password)) validationErrors.push({ field: "password", msg: "Câmp obligatoriu." });
    if (!validator.isLength(password, { max: 50 }))
        validationErrors.push({ field: "password", msg: "Câmp obligatoriu." });

    if (validationErrors.length) {
        // add also the initial values
        let emailFound = false;
        validationErrors.forEach(x => {
            if (x.field === "email") {
                x.val = email;
                emailFound = true;
            }
        });

        if (!emailFound) {
            validationErrors.push({ field: "email", val: email });
        }

        req.flash("validationErrors", validationErrors);

        return res.redirect("/login");
    }

    try {
        const { user, token } = await authService.login(email, password);
        // return res
        //     .status(200)
        //     .json({ user, token })
        //     .end();
        setCookies(req, res, token, user);
        res.redirect("/");
    } catch (error) {
        const validationErrors = [
            { field: "email", val: email },
            { field: "password", msg: error.message }
        ];
        req.flash("validationErrors", validationErrors);
        return res.redirect("/login");
        // return res.status(401).json(error.message);
    }
};

exports.logout = (req, res) => {
    // http://expressjs.com/api.html#res.clearCookie
    //res.clearCookie('access_token', { path: '/' });
    //res.clearCookie('user', { path: '/' });

    const c1 = cookie.serialize("access_token", "", { path: "/", expires: new Date(1) });
    const c2 = cookie.serialize("XSRF-TOKEN", "", { path: "/", expires: new Date(1) });
    const c3 = cookie.serialize("user", "", { path: "/", expires: new Date(1) });

    // http://www.connecto.io/blog/nodejs-express-how-to-set-multiple-cookies-in-the-same-response-object/
    res.header("Set-Cookie", [c1, c2, c3]); // array of cookies http://expressjs.com/api.html#res.set

    req.user = null;
    res.redirect("/");
};

exports.getSignup = (req, res) => {
    if (req.user) return res.redirect("/"); // already authenticated

    let data = {};
    const errors = req.flash("validationErrors"); // Get an array of flash messages by passing the key

    if (errors.length) {
        // redirect from POST (with errors)
        data = arrayHelper.arrayToObject(errors, "field");
        if (data.email.msg) data.email.hasAutofocus = true;
        else data.password.hasAutofocus = true;
    } else if (req.query.email) {
        // new page with email (from url)
        data.email = { val: req.query.email };
        data.password = { hasAutofocus: true };
    } else {
        // clean, new page
        data.email = { hasAutofocus: true };
    }

    // const isFocusOnEmail = data.email && (emailRecord.msg || !emailRecord.val);
    // if (isFocusOnEmail) {
    //     errors.forEach(x => {
    //         if (x.type === "email") x.hasAutofocus = true;
    //         else x.hasAutofocus = false;
    //     });
    // } else {
    //     errors.forEach(x => {
    //         if (x.type === "password") x.hasAutofocus = true;
    //         else x.hasAutofocus = false;
    //     });
    // }

    res.render("user/signup", { data, errors });
};

exports.postSignup = async function(req, res) {
    const { password, confirmPassword } = req.body;
    let { email } = req.body;

    email = email.toLowerCase();

    const validationErrors = [];

    const [emailMsg, passwordMsg, confirmPasswordMsg] = await Promise.all([
        await getEmailError(email),
        await getPasswordError(password),
        await getConfirmPasswordError(password, confirmPassword)
    ]);

    if (emailMsg) validationErrors.push({ field: "email", msg: emailMsg });
    if (passwordMsg) validationErrors.push({ field: "password", msg: passwordMsg });
    if (confirmPasswordMsg) validationErrors.push({ field: "confirmPassword", msg: confirmPasswordMsg });

    // if (Object.getOwnPropertyNames(errors).length !== 0) {
    if (validationErrors.length) {
        // add also the initial values
        let emailFound = false;
        validationErrors.forEach(x => {
            if (x.field === "email") {
                x.val = email;
                emailFound = true;
            }
        });

        if (!emailFound) {
            validationErrors.push({ field: "email", val: email });
        }

        req.flash("validationErrors", validationErrors); // Set a flash message by passing the key, followed by the value

        return res.redirect("/signup");
    }

    // return res.send("ok");
    // return res.redirect("/");

    try {
        const { user, token } = await authService.signUp(email, password);
        // return res.json({ user, token }).status(200).end();
        setCookies(req, res, token, user);
        res.redirect("/");
    } catch (error) {
        // return res.json(error).status(500).end();
        return res.status(401).json(error.message);
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
exports.changePassword = async (req, res) => {
    const userId = String(req.user._id); //without 'String' the result is an Object
    const oldPass = String(req.body.oldPassword);
    const newPass = String(req.body.newPassword);

    const user = await userService.getOneById(userId);

    // if (authHelper.authenticate(oldPass, user.hashedPassword, user.salt)) {
    //     user.salt = authHelper.makeSalt();
    //     user.hashedPassword = authHelper.encryptPassword(newPass, user.salt);
    //     delete user.password;

    //     await userService.updateOne(user);
    //     // if (err) return validationError(res, err);
    //     res.redirect("/"); // for requests that come from server-side (Jade)
    // } else {
    //     res.status(403).send("Forbidden");
    // }
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

            const userProfile = {
                //exclude sensitive info
                name: user.name,
                email: user.email,
                role: user.role
            };

            setCookies(req, res, token, userProfile);

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

function setCookies(req, res, token, userProfile) {
    // Stormpath recommends that you store your JWT in cookies:
    // https://stormpath.com/blog/where-to-store-your-jwts-cookies-vs-html5-web-storage
    // all details are sumarized here: http://disq.us/p/16qo82e
    const milliseconds = 1000 * 60 * 60 * 24 * 365; // (1000 = 1 sec) http://stackoverflow.com/a/9718416/2726725

    const isSecure = process.env.NODE_ENV == "production"; // in production the cookie is sent only over https

    // "secure" flag == true => this cookie will only be sent over an HTTPS connection
    // "httpOnly" flag == true => JavaScript will not be able to read this authentication cookie
    // "httpOnly" is used to prevent XSS (Cross-Site Scripting)
    const c1 = cookie.serialize("access_token", token, {
        path: "/",
        maxAge: milliseconds,
        httpOnly: true,
        secure: isSecure
    });

    // 'XSRF-TOKEN' is the default name in Anguler for CSRF token
    // 'XSRF-TOKEN' is used to prevent CSRF (Cross-Site Request Forgery)
    const c2 = cookie.serialize("XSRF-TOKEN", token, { path: "/", maxAge: milliseconds });

    // only for client
    const c3 = cookie.serialize("user", JSON.stringify(userProfile), { path: "/", maxAge: milliseconds });

    // http://www.connecto.io/blog/nodejs-express-how-to-set-multiple-cookies-in-the-same-response-object/
    res.header("Set-Cookie", [c1, c2, c3]); // array of cookies http://expressjs.com/api.html#res.set
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
    return jwt.sign({ _id: id }, config.session_secret, { expiresIn: 60 * 60 * 24 * 365 }); // in seconds
}

const getEmailError = async email => {
    if (validator.isEmpty(email)) return "Camp obligatoriu.";
    if (!validator.isLength(email, { max: 50 })) return "Maxim 50 caractere.";
    if (!validator.isEmail(email)) return "Email invalid.";

    const normalizedEmail = validator.normalizeEmail(email, { gmail_remove_dots: false });
    const found = await userService.getOneByEmail(normalizedEmail);
    if (found) return "Exista deja un cont cu acest email.";

    return null;
};

const getPasswordError = async password => {
    if (validator.isEmpty(password)) return "Camp obligatoriu.";
    if (!validator.isLength(password, { min: 6 })) return "Minim 6 caractere.";
    if (!validator.isLength(password, { max: 50 })) return "Maxim 50 caractere.";
    return null;
};

const getConfirmPasswordError = async (password, confirmPassword) => {
    if (validator.isEmpty(confirmPassword)) return "Camp obligatoriu.";
    if (confirmPassword !== password) return "Parolele nu coincid.";
    return null;
};
