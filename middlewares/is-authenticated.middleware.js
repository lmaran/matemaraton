exports.isAuthenticated = (req, res, next) => {
    if (req.user) next();
    else {
        let loginUrl = "/login";
        if (req.originalUrl) loginUrl += `?redirect_uri=${req.originalUrl}`;

        res.redirect(loginUrl);
    }
};
