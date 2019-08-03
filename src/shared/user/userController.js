const userService = require("./userService");
const userService2 = require("./user.service");
const userValidator = require("./userValidator");

// const passport = require("passport");
const config = require("../../shared/config");
// const jwt = require("jsonwebtoken");
const uuid = require("uuid");
// const customerEmployeeService = require("../customerEmployee/customerEmployeeService");
const auth = require("./login/loginService");
const emailService = require("../../shared/helpers/emailService");

const validationError = function(res, err) {
    return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.getAll = function(req, res) {
    const odataQuery = req.query;
    odataQuery.hasCountSegment = req.url.indexOf("/$count") !== -1; //check for $count as a url segment

    userService.getAll(odataQuery, function(err, users) {
        if (err) {
            return handleError(res, err);
        }
        res.status(200).json(users);
    });
};

/**
 * Creates a new user
 */
exports.create = function(req, res) {
    userValidator.all(req, res, function(errors) {
        if (errors) {
            res.status(400).send({ errors: errors }); // 400 - bad request
        } else {
            const user = req.body;

            user.isActive = true;
            user.provider = "local";
            user.role = "admin";
            user.createdBy = req.user.name;
            user.createdOn = new Date();
            user.activationToken = uuid.v4();
            if (user.email) {
                user.email = user.email.toLowerCase();
            }
            //user.status = 'waitingToBeActivated';

            userService.create(user, function(err, response) {
                if (err) {
                    return handleError(res, err);
                }
                res.status(201).json(response.ops[0]);

                // send an email with an activationLink
                const from = user.email;
                const subject = "Activare cont";

                let tpl = "";
                tpl += '<p style="margin-bottom:30px;">Buna <strong>' + user.name + "</strong>,</p>";
                tpl += user.createdBy + " ti-a creat un cont de acces in aplicatie. ";
                tpl += "Pentru activarea acestuia, te rog sa folosesti link-ul de mai jos:";
                tpl +=
                    '<p><a href="' +
                    config.externalUrl +
                    "/activate/" +
                    user._id +
                    "?activationToken=" +
                    user.activationToken +
                    '">Activare cont</a></p>';
                tpl += '<p style="margin-top:30px">Acest email a fost generat automat.</p>';

                emailService.sendEmail(from, subject, tpl).then(
                    function(result) {
                        console.log(result);
                        //res.status(201).json(response.ops[0]);
                    },
                    function(err) {
                        console.log(err);
                        //handleError(res, err)
                    }
                );
            });
        }
    });
};

exports.createPublicUser = function(req, res) {
    const data = req.body;

    // customerEmployeeService.getByValue("email", data.email, null, function(err, customerEmployee) {
    //     if (err) {
    //         return handleError(res, err);
    //     }

    //     if (customerEmployee) {
    //         const user = {};
    //         user.name = customerEmployee.name;
    //         if (customerEmployee.email) {
    //             user.email = customerEmployee.email.toLowerCase();
    //         }

    //         user.salt = userService.makeSalt();
    //         user.hashedPassword = userService.encryptPassword(data.password, user.salt);

    //         user.provider = "local";
    //         user.role = "user";

    //         user.isActive = true;
    //         user.createdBy = "External user";
    //         user.createdOn = new Date();

    //         userService.create(user, function(err) {
    //             if (err) {
    //                 return handleError(res, err);
    //             }
    //             //res.status(201).json(response.ops[0]);

    //             // keep user as authenticated
    //             const token = auth.signToken(user._id, user.role);

    //             const userProfile = {
    //                 //exclude sensitive info
    //                 name: user.name,
    //                 email: user.email,
    //                 role: user.role
    //             };

    //             auth.setCookies(req, res, token, userProfile);

    //             res.redirect("/");
    //         });

    //         //res.json(customerEmployee);
    //     } else {
    //         res.send(false);
    //     }
    // });
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
    console.log(11);
    const userId = String(req.user._id); //without 'String' the result is an Object
    const oldPass = String(req.body.oldPassword);
    const newPass = String(req.body.newPassword);

    const user = await userService2.getOneById(userId);

    console.log(user);
    if (userService.authenticate(oldPass, user.hashedPassword, user.salt)) {
        console.log("is auth");
        user.salt = userService.makeSalt();
        user.hashedPassword = userService.encryptPassword(newPass, user.salt);
        delete user.password;

        await userService2.updateOne(user);
        // if (err) return validationError(res, err);
        res.redirect("/"); // for requests that come from server-side (Jade)
    } else {
        res.status(403).send("Forbidden");
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

    userService.getById(userId, function(err, user) {
        user.salt = userService.makeSalt();
        user.hashedPassword = userService.encryptPassword(psw, user.salt);
        delete user.activationToken;

        user.modifiedBy = user.name;
        user.modifiedOn = new Date();

        userService.update(user, function(err, response) {
            if (err) return validationError(res, err);

            // keep user as authenticated
            const token = auth.signToken(user._id, user.role);

            const userProfile = {
                //exclude sensitive info
                name: user.name,
                email: user.email,
                role: user.role
            };

            auth.setCookies(req, res, token, userProfile);

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
