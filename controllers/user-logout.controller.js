const cookieHelper = require("../helpers/cookie.helper");

exports.logout = (req, res) => {
    // // http://expressjs.com/api.html#res.clearCookie
    // //res.clearCookie('access_token', { path: '/' });
    // //res.clearCookie('user', { path: '/' });

    // const c1 = cookie.serialize("access_token", "", { path: "/", expires: new Date(1) });
    // const c2 = cookie.serialize("XSRF-TOKEN", "", { path: "/", expires: new Date(1) });
    // const c3 = cookie.serialize("user", "", { path: "/", expires: new Date(1) });

    // // http://www.connecto.io/blog/nodejs-express-how-to-set-multiple-cookies-in-the-same-response-object/
    // res.header("Set-Cookie", [c1, c2, c3]); // array of cookies http://expressjs.com/api.html#res.set

    cookieHelper.clearCookies(res);

    req.user = null;
    res.redirect(req.query.redirect_uri || "/");
};
