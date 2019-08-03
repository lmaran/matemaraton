const passport = require("passport");
const auth = require("../loginService");

// Passport Configuration (once)
require("./passportConfig");

exports.authenticate = function (req, res, next) {

    // auth with custom callback: http://passportjs.org/docs/authenticate
    passport.authenticate("local", function (err, user, info) {
        // console.log("asd2");
        const error = err || info;
        // console.log(error);
        if (error) return res.status(401).json(error);
        if (!user) return res.status(404).json({ message: "Something went wrong, please try again." });

        const token = auth.signToken(user._id, user.role);

        const userProfile = {
            //exclude sensitive info
            name: user.name,
            email: user.email,
            role: user.role
        };

        auth.setCookies(req, res, token, userProfile);

        if (req.is("json")) {
            // http://expressjs.com/api.html#req.is
            res.json(userProfile); // for requests that come from client-side (Angular)
        } else res.redirect("/"); // for requests that come from server-side (Jade)
    })(req, res, next);
};
