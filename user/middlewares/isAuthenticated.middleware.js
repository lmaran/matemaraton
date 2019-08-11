exports.isAuthenticated = (req, res, next) => {
    // if (req.isAuthenticated()) {
    //     return next();
    // }
    if (req.user) next();
    else res.redirect("/login"); // res.status(401).send("Unauthorized");
};
