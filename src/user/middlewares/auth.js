const jwt = require("jsonwebtoken");
const config = require("../../shared/config");

exports.addUserIfExist2 = async (req, res, next) => {
    console.log("req ++++++++++++++++++++ ");
    // console.log(req.body);
    // console.log(req.headers);
    console.log(req.url);
    // console.log(req.method);

    if (req.cookies && req.cookies.access_token) {
        const token = req.cookies.access_token;

        const secret = config.secrets.session;
        const options = {};

        jwt.verify(token, secret, options, function(err, decoded) {
            if (err) {
                // throw new Error(err);

                next(err);
            }
            console.log("decoded:");
            console.log(decoded);
            req.decoded = decoded;
        });
    }
    next();
};
