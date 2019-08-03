(function(userValidator) {
    const userService = require("./userService");
    const async = require("async");
    const validator = require("validator");
    const _ = require("lodash");

    // requiredAndUnique
    userValidator.name = function(req, res, cbResult) {
        const fieldVal = req.body.name;
        async.series(
            [
                function(cb) {
                    if (fieldVal === undefined || fieldVal === "") {
                        cb("Acest camp este obligatoriu.");
                    } else if (fieldVal && fieldVal.length > 50) {
                        cb("Maxim 50 caractere.");
                    } else cb(null, "checkNext");
                },
                function(cb) {
                    userService.getByValue("name", fieldVal, req.body._id, function(err, user) {
                        if (err) {
                            return handleError(res, err);
                        }
                        if (user) {
                            cb("Exista deja o inregistrare cu aceasta valoare.");
                        } else cb(null, "checkNext");
                    });
                }
            ],
            function(err) {
                if (err == null) cbResult(null, null);
                // return null if no error
                else cbResult(null, { field: "name", msg: err });
            }
        );
    };

    // optionalAndUniqueEmail
    userValidator.email = function(req, res, cbResult) {
        const fieldVal = req.body.email;
        async.series(
            [
                function(cb) {
                    if (fieldVal === undefined || fieldVal === "") {
                        cb("Acest camp este obligatoriu.");
                    } else if (fieldVal && fieldVal.length > 50) {
                        cb("Maxim 50 caractere.");
                    } else if (fieldVal && !validator.isEmail(fieldVal)) {
                        cb("Adresa de email invalida.");
                    } else cb(null, "checkNext");
                },
                function(cb) {
                    if (fieldVal)
                        userService.getByValue("email", fieldVal, req.body._id, function(err, user) {
                            if (err) {
                                return handleError(res, err);
                            }
                            if (user) {
                                cb("Exista deja o inregistrare cu aceasta valoare.");
                            } else cb(null, "checkNext");
                        });
                    else cb(null, "checkNext");
                }
            ],
            function(err) {
                if (err == null)
                    // no validation errors
                    cbResult(null, null);
                else cbResult(null, { field: "email", msg: err });
            }
        );
    };

    // all validations
    userValidator.all = function(req, res, cbResult) {
        async.parallel(
            [
                function(cb) {
                    userValidator.name(req, res, cb);
                },
                function(cb) {
                    userValidator.email(req, res, cb);
                }
            ],
            function(err, results) {
                results = _.compact(results); // remove null elements from array
                if (results.length == 0) results = null; // return null if no errors
                cbResult(results);
            }
        );
    };

    function handleError(res, err) {
        return res.status(500).send(err);
    }
})(module.exports);
