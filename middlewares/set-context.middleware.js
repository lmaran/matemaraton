const urlHelper = require("../helpers/url.helper");

exports.setContext = async (req, res, next) => {
    req.ctx = {};

    req.ctx.user = req.user;

    res.locals.redirectUri = urlHelper.getCurrentEncodedUri(req); // e.g: /students?active=true
    res.locals.isNotRootPath = !urlHelper.isRootPath(req);

    next();
};
