const urlHelper = require("../helpers/url.helper");

exports.setContext = async (req, res, next) => {
    // req.locals are global variables used by handlebars (called as @root.user, @root.redirectUri etc)
    res.locals.user = req.user;
    res.locals.redirectUri = urlHelper.getCurrentEncodedUri(req); // e.g: /students?active=true
    res.locals.isNotRootPath = !urlHelper.isRootPath(req);

    next();
};
