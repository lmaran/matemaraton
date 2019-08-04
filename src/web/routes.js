const express = require("express");
const router = express.Router();

const homeController = require("./controllers/home.controller");
const meController = require("./controllers/me.controller");
const matemaratonController = require("../web/controllers/matemaraton.controller");
const problemController = require("../web/controllers/problem.controller");

const contactController = require("./controllers/contact.controller");
const pageController = require("./controllers/page.controller");
const auth = require("../shared/user/login/loginService");

// home
router.get("/", homeController.getHomePage);

router.post("/login/", require("../shared/user/login/local/loginLocalController").authenticate);
router.get("/logout", auth.isAuthenticated(), require("../shared/user/logout/logoutController").logout);
// app.get('/me', auth.isAuthenticated(), require('./user/userController').me);
router.post("/me/changepassword", auth.isAuthenticated(), require("../shared/user/userController").changePassword);
router.get("/login", function(req, res) {
    res.render("user/login");
});
router.get("/register", function(req, res) {
    res.render("user/register", { email: req.query.email });
});
router.get("/changePassword", auth.isAuthenticated(), function(req, res) {
    res.render("user/changePassword", { user: req.user });
});

// my page
router.get("/pagina-mea", meController.getMyPage);

// router.get("/matemaraton/:edition", matemaratonController.getEditionHomepage);
router.get("/:edition?/prezenta/grupe/:groupId", matemaratonController.getPresencePerGroup);
router.get("/:edition?/prezenta/elevi/:studentId", matemaratonController.getPresencePerStudent);
router.get("/:edition?/pregatire-simulare-en", matemaratonController.getTrainingProgramForENSimulation);
router.get("/:edition?/cursuri/grupe/:groupId", matemaratonController.getCoursesPerGroup);
router.get("/:edition?/cursuri/:courseId", matemaratonController.getCourse);
router.get("/:edition?", matemaratonController.getMatemaraton);

// contact
router.get("/contact", contactController.getContact);

// pages
router.get("/:pageId", pageController.getPage);

// problems
router.get("/probleme/:id", problemController.getProblem);

router.get("/:pageId/asdfgh", pageController.getPage2);

module.exports = router;
