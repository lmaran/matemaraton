const urlHelper = require("../helpers/url.helper");
const config = require("../config");

exports.setContext = async (req, res, next) => {
    req.ctx = {};

    // console.log("req ++++++++++++++++++++ ");
    // console.log(req.body);
    // // console.log(req.headers);
    // console.log(req.url);
    // console.log(req.method);
    // console.log("req end ++++++++++++++++++++ ");
    // console.log("");

    // 1. set requestId
    // req.ctx.requestId = randomstring.generate(8);

    // // 2. set tenantCode
    // req.ctx.tenantCode = urlHelper.getTenantCode(req.subdomains);

    // 3. set selected menu as active
    // let firstSegment = req.path.split("/")[1];
    req.ctx.selectedTopMenu = req.path; // "/profesori"
    // added in middleware before
    // console.log("====================");
    // console.log(req.user);
    req.ctx.user = req.user;
    req.ctx.isUserAdmin = req.user && req.user.isAdmin;

    res.locals.redirectUri = urlHelper.getCurrentEncodedUri(req); // e.g: /students?active=true
    res.locals.isNotRootPath = !urlHelper.isRootPath(req);

    res.locals.isDevEnv = config.env === "development";

    next();
};
