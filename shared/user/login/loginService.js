// const passport = require("passport");
const config = require("../../../shared/config");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt"); // Middleware that validates JsonWebTokens and sets req.user to be used by later middleware
const compose = require("composable-middleware"); // Treat a sequence of middleware as middleware.
const userService = require("../userService");
const validateJwt = expressJwt({ secret: config.secrets.session });
const cookie = require("cookie");

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
    // the logic that adds the user to the reques was moved to 'addUserIfExist' middleware
    return function(req, res, next) {
        if (req.user) next();
        else return res.status(401).send("Unauthorized");
    };
}

function addUserIfExist() {
    // console.log(111);
    return (
        compose()
            // Validate jwt
            .use(function(req, res, next) {
                // allow access_token to be passed through query parameter as well
                // if (req.query && req.query.hasOwnProperty('access_token')) {
                //     req.headers.authorization = 'Bearer ' + req.query.access_token;
                // };

                if (req.cookies && req.cookies.access_token) {
                    req.headers.authorization = "Bearer " + req.cookies.access_token;
                    validateJwt(req, res, next);
                } else next();
            })
            // Attach user to request
            .use(async (req, res, next) => {
                // console.log(222);
                if (req.user) {
                    // console.log(req.user);

                    try {
                        const user = await userService.getByIdWithoutPsw2(req.user._id);
                        // console.log(2222);

                        // console.log(user);
                        if (user) {
                            if (user.role.indexOf("admin") > -1) user.isAdmin = true; //add this property for navbar
                            if (user.role.indexOf("partner") > -1) user.isPartner = true; //add this property for navbar
                            req.user = user;
                        }
                        next();
                    } catch (error) {
                        next(error);
                    }
                } else {
                    next();
                }
            })
    );
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
    if (!roleRequired) throw new Error("Required role needs to be set");

    return compose()
        .use(isAuthenticated())
        .use(function meetsRequirements(req, res, next) {
            if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
                next();
            } else {
                res.status(403).send("Forbidden");
            }
        });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
    return jwt.sign({ _id: id }, config.secrets.session, { expiresIn: 60 * 60 * 24 * 365 }); // in seconds
}

// /**
//  * Set token cookie directly for oAuth strategies; used by Social login controllers
//  */
// function setTokenCookie(req, res) {
//     if (!req.user) return res.status(404).json({ message: 'Something went wrong, please try again.' });
//     var token = signToken(req.user._id, req.user.role);
//     res.cookie('token', JSON.stringify(token));
//     res.redirect('/');
// }

// used by loginLocalController
function setCookies(req, res, token, userProfile) {
    // Stormpath recommends that you store your JWT in cookies:
    // https://stormpath.com/blog/where-to-store-your-jwts-cookies-vs-html5-web-storage
    // all details are sumarized here: http://disq.us/p/16qo82e
    const milliseconds = 1000 * 60 * 60 * 24 * 365; // (1000 = 1 sec) http://stackoverflow.com/a/9718416/2726725

    const isSecure = process.env.NODE_ENV == "production"; // in production the coockie is sent only over https

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

module.exports = {
    isAuthenticated: isAuthenticated,
    hasRole: hasRole,
    signToken: signToken,
    //setTokenCookie: setTokenCookie,
    setCookies: setCookies,
    addUserIfExist: addUserIfExist
};
