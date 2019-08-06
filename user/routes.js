const express = require("express");
const router = express.Router();

const userController = require("./controllers/user.controller");
const auth = require("./services/loginService");

router.post("/login/", userController.authenticate);
router.get("/logout", auth.isAuthenticated(), userController.logout);
// app.get('/me', auth.isAuthenticated(), require('./user/userController').me);
router.post("/me/changepassword", auth.isAuthenticated(), userController.changePassword);
router.get("/login", function(req, res) {
    res.render("user/login");
});
router.get("/register", function(req, res) {
    res.render("user/register", { email: req.query.email });
});
router.get("/changePassword", auth.isAuthenticated(), function(req, res) {
    res.render("user/changePassword", { user: req.user });
});

module.exports = router;
