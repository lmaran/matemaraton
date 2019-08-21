const jwt = require("jsonwebtoken");
const config = require("../../shared/config");
const userService = require("../../user/services/user.service");

exports.addUserIfExist = async (req, res, next) => {
    // this middleware depends on "cookie-parser"
    if (req.cookies && req.cookies.access_token) {
        const token = req.cookies.access_token;
        const secret = config.session_secret;
        const options = {};

        jwt.verify(token, secret, options, async function(err, jwtPayload) {
            if (err) {
                next(err); // throw new Error(err);
            }

            // Attach user to request
            if (jwtPayload && jwtPayload._id) {
                const userId = jwtPayload._id; // jwtPayload = {_id, iat, exp}
                try {
                    req.user = await userService.getByIdWithoutPsw2(userId);
                    res.locals.user = req.user;
                    next();
                } catch (error) {
                    next(error);
                }
            } else {
                next();
            }
        });
    } else {
        next();
    }
};
