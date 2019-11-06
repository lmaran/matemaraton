const express = require("express");
const router = express.Router();

const homeController = require("./controllers/home.controller");
const meController = require("./controllers/me.controller");
const matemaratonController = require("./controllers/matemaraton.controller");
const problemController = require("./controllers/problem.controller");
const classController = require("./controllers/class.controller");
const studentController = require("./controllers/student.controller");

const contactController = require("./controllers/contact.controller");
const pageController = require("./controllers/page.controller");
const userController = require("./controllers/user.controller");
const isAuthenticated = require("./middlewares/isAuthenticated.middleware").isAuthenticated;
const presenceController = require("./controllers/presence.controller");
const courseController = require("./controllers/course.controller");
// const upgradeOperationController = require("./controllers/upgrade-operation.controller");

// home
router.get("/", homeController.getHomePage);

// uncomment this route in order to make upgrade operations
// router.get("/upgrade-operation", upgradeOperationController.moveSchoolClassNameFromStudentToPerson);

// my page
router.get("/pagina-mea", meController.getMyPage);

// class
router.get("/clase/:classId", classController.getClass);

// presence
router.get("/clase/:classId/prezenta", presenceController.getPresencePerClass);
router.get("/elevi/:studentId/prezenta", presenceController.getPresencePerStudent);

// courses
router.get("/clase/:classId/cursuri", courseController.getCoursesPerClass);
router.get("/cursuri/:courseId", courseController.getCourse);

// students
router.get("/clase/:classId/elevi", studentController.getStudentsPerClass);

// router.get("/matemaraton/:edition", matemaratonController.getEditionHomepage);
// router.get("/:edition?/prezenta/grupe/:groupId", matemaratonController.getPresencePerGroup);
// router.get("/:edition?/prezenta/elevi/:studentId", matemaratonController.getPresencePerStudent);
router.get("/pregatire-simulare-en-editia-2", matemaratonController.getTrainingProgramForENSimulationEdition2);
// router.get("/:edition?/cursuri/grupe/:groupId", matemaratonController.getCoursesPerGroup);
// router.get("/:edition?/cursuri/:courseId", matemaratonController.getCourse);
router.get("/:edition?", matemaratonController.getMatemaraton);

// contact
router.get("/contact", contactController.getContact);

// problems
router.get("/probleme/:id", problemController.getProblem);
router.post("/probleme", problemController.createProblem);

router.get("/:pageId/asdfgh", pageController.getPage2);

// user
router.get("/user/login", userController.getLogin);
router.post("/user/login/", userController.postLogin);

router.get("/user/logout", isAuthenticated, userController.logout);

router.get("/user/signup", userController.getSignup);
router.post("/user/signup", userController.postSignup);

// app.get('/me', auth.isAuthenticated(), require('./user/userController').me);
router.post("/user/me/changepassword", isAuthenticated, userController.changePassword);

router.get("/user/changePassword", isAuthenticated, function(req, res) {
    res.render("user/changePassword", { user: req.user });
});

// pages
router.get("/:pageId", pageController.getPage);

module.exports = router;
