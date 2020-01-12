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
// const userController = require("./controllers/user.controller");
const userResetPasswordController = require("./controllers/user-reset-password.controller");
const userChangePasswordController = require("./controllers/user-change-password.controller");
const userSignupController = require("./controllers/user-signup.controller");
const userLoginController = require("./controllers/user-login.controller");
const userLogoutController = require("./controllers/user-logout.controller");

const isAuthenticated = require("./middlewares/is-authenticated.middleware").isAuthenticated;
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

// user-login/logout
router.get("/login", userLoginController.getLogin);
router.post("/login", userLoginController.postLogin);
router.get("/logout", isAuthenticated, userLogoutController.logout);

// user-signup
router.post("/signup/invite", userSignupController.postInviteToSignup);
router.get("/signup/invitation-sent", userSignupController.displaySignupInvitationSent);
router.get("/signup", userSignupController.getSignup);
router.post("/signup", userSignupController.postSignup);
router.get("/signup/ask-to-confirm", userSignupController.displaySignupAskToConfirm);
router.get("/signup/confirm/:activationCode", userSignupController.getSignupConfirm);
router.get("/signup/confirm-invitation-done", userSignupController.getSignupConfirmInvitationDone);

// user-change-password
router.get("/change-password", isAuthenticated, userChangePasswordController.getChangePassword);
router.post("/change-password", isAuthenticated, userChangePasswordController.postChangePassword);

// user-reset-password (step1: request, step2: confirmation)
router.get("/reset-password", userResetPasswordController.getResetPassword);
router.post("/reset-password", userResetPasswordController.postResetPassword);
router.get("/reset-password/ask-to-confirm", userResetPasswordController.displayResetPasswordAskToConfirm);
router.get("/reset-password/confirm/:resetPasswordCode", userResetPasswordController.getResetPasswordConfirm);

// router.get("/:edition?/cursuri/grupe/:groupId", matemaratonController.getCoursesPerGroup);
// router.get("/:edition?/cursuri/:courseId", matemaratonController.getCourse);
// router.get("/:edition?", matemaratonController.getMatemaraton);

// pages
router.get("/:pageId", pageController.getPage);

module.exports = router;
