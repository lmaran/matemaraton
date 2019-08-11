const express = require("express");
const router = express.Router();

const userController = require("./controllers/user.controller");
const isAuthenticated = require("./middlewares/isAuthenticated.middleware").isAuthenticated;

router.get("/login", userController.getLogin);
router.post("/login/", userController.postLogin);

router.get("/logout", isAuthenticated, userController.logout);

router.get("/signup", userController.getSignup);
router.post("/signup", userController.postSignup);

// app.get('/me', auth.isAuthenticated(), require('./user/userController').me);
router.post("/me/changepassword", isAuthenticated, userController.changePassword);

router.get("/changePassword", isAuthenticated, function(req, res) {
    res.render("user/changePassword", { user: req.user });
});

module.exports = router;
