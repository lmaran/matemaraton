const express = require("express");
const router = express.Router();

const homeController = require("./controllers/home.controller");
const meController = require("./controllers/me.controller");
const matemaratonController = require("./controllers/matemaraton.controller");
const problemController = require("./controllers/problem.controller");
const classController = require("./controllers/class.controller");
const studentController = require("./controllers/student.controller");
const parentController = require("./controllers/parent.controller");

const contactController = require("./controllers/contact.controller");
const pageController = require("./controllers/page.controller");
const userController = require("./controllers/user.controller");
const isAuthenticated = require("./middlewares/isAuthenticated.middleware").isAuthenticated;
const presenceController = require("./controllers/presence.controller");
const courseController = require("./controllers/course.controller");

// home
router.get("/", homeController.getHomePage);

// uncomment this route in order to make upgrade operations
// const upgradeOperationController = require("./controllers/upgrade-operation.controller");
// router.get("/upgrade-operation", upgradeOperationController.removeParentDetails);

// my page
router.get("/pagina-mea", meController.getMyPage);

// class
router.get("/clase/:classId", classController.getClass);

// presence
router.get("/clase/:classId/prezenta", presenceController.getPresencePerClass);
router.get("/clase/:classId/total-prezente-pe-elevi", presenceController.getTotalPresencesPerStudents);
router.get("/elevi/:studentId/prezenta", presenceController.getPresencePerStudent);

// parents
router.get("/clase/:classId/parinti", parentController.getParentsPerClass);
router.get("/parinti/:parentId", parentController.getParent);

// courses
router.get("/clase/:classId/cursuri", courseController.getCoursesPerClass);
router.get("/cursuri/:courseId", courseController.getCourse);

// students
router.get("/clase/:classId/elevi", studentController.getStudentsPerClass);
router.get("/elevi/:studentId", studentController.getStudent);

// router.get("/matemaraton/:edition", matemaratonController.getEditionHomepage);
// router.get("/:edition?/prezenta/grupe/:groupId", matemaratonController.getPresencePerGroup);
// router.get("/:edition?/prezenta/elevi/:studentId", matemaratonController.getPresencePerStudent);
router.get("/pregatire-simulare-en-editia-2", matemaratonController.getTrainingProgramForENSimulationEdition2);
router.get("/pregatire-teza-s1-editia-3", matemaratonController.getTrainingProgramForSemestrialPaperEdition3);
router.get("/materiale-teza-s1", matemaratonController.getDocumentsForSemestrialPaper);

// contact
router.get("/contact", contactController.getContact);

// problems
router.get("/probleme/:id", problemController.getProblem);
router.post("/probleme", problemController.createProblem);

router.get("/:pageId/asdfgh", pageController.getPage2);

// user
router.get("/login", userController.getLogin);
router.post("/login", userController.postLogin);
router.get("/logout", isAuthenticated, userController.logout);
router.get("/signup", userController.getSignup);
router.post("/signup", userController.postSignup);
router.get("/signup-activation/:activationCode", userController.signupActivation);
router.get("/signup-ask-to-complete", userController.askToComplete);
router.get("/signup-completed", userController.signupCompleted);

router.post("/invite-to-signup", userController.inviteToSignup);
router.get("/invite-confirm/:userId/:invitationCode", userController.getInviteConfirm);
// router.get("/check-send-email", userController.checkSendEmail);

// app.get('/me', auth.isAuthenticated(), require('./user/userController').me);
router.get("/changepassword", isAuthenticated, userController.getChangePassword);
router.post("/changepassword", isAuthenticated, userController.postChangePassword);

// router.get("/:edition?/cursuri/grupe/:groupId", matemaratonController.getCoursesPerGroup);
// router.get("/:edition?/cursuri/:courseId", matemaratonController.getCourse);
router.get("/:edition?", matemaratonController.getMatemaraton);

// pages
router.get("/:pageId", pageController.getPage);

module.exports = router;
