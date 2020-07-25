const express = require("express");
const router = express.Router();

const homeController = require("./controllers/home.controller");
const editionController = require("./controllers/edition.controller");
const meController = require("./controllers/me.controller");
const matemaratonController = require("./controllers/matemaraton.controller");
const exerciseController = require("./controllers/exercise.controller");
const classController = require("./controllers/class.controller");
const studentController = require("./controllers/student.controller");
const parentController = require("./controllers/parent.controller");

const contactController = require("./controllers/contact.controller");
const userResetPasswordController = require("./controllers/user-reset-password.controller");
const userChangePasswordController = require("./controllers/user-change-password.controller");
const userSignupController = require("./controllers/user-signup.controller");
const userLoginController = require("./controllers/user-login.controller");
const userLogoutController = require("./controllers/user-logout.controller");

const isAuthenticated = require("./middlewares/is-authenticated.middleware").isAuthenticated;
const presenceController = require("./controllers/presence.controller");
const courseController = require("./controllers/course.controller");
const homeworkController = require("./controllers/homework.controller");

const idGeneratorController = require("./controllers/id-generator.controller");

// home
router.get("/", homeController.getHomePage);

// uncomment this route in order to make upgrade operations
const upgradeOperationController = require("./controllers/upgrade-operation.controller");
router.get("/upgrade-operation", upgradeOperationController.upgradeOperation);

// my page
router.get("/pagina-mea", meController.getMyPage);

// class
router.get("/clase/:classId", classController.getClass);

// presence
router.get("/clase", classController.getClasses);
router.get("/clase/:classId/prezenta", presenceController.getPresencePerClass);
router.get("/clase/:classId/total-prezente", presenceController.getTotalPresences);
router.get("/clase/:classId/elevi/:studentId/prezenta", presenceController.getPresencePerStudent);

// homework
router.get("/clase/:classId/teme-propuse", homeworkController.getHomeworkRequests);
router.get("/clase/:classId/total-teme-predate", homeworkController.getTotalHomeworkSubmissions);
router.get("/clase/:classId/teme/:homeworkRequestId", homeworkController.getHomeworkRequest);
router.get("/clase/:classId/elevi/:studentId/teme-predate", homeworkController.getHomeworkSubmissionsPerStudent);

// parents
router.get("/clase/:classId/parinti", parentController.getParentsPerClass);
router.get("/parinti/:parentId", parentController.getParent);

// courses
router.get("/clase/:classId/cursuri", courseController.getCoursesPerClass);
router.get("/clase/:classId/cursuri/poze", courseController.getCoursesPerClassWithPhotos);
router.get("/cursuri/:courseId", courseController.getCourse);

// students
router.get("/clase/:classId/elevi", studentController.getStudentsPerClass);
router.get("/elevi/:studentId", studentController.getStudent);

router.get("/program-simulare-en-editia-2", matemaratonController.getTrainingProgramForENSimulationEdition2);
router.get("/program-teza-s1-editia-3", matemaratonController.getTrainingProgramForSemestrialPaperEdition3);
router.get("/materiale-teza-s1", matemaratonController.getDocumentsForSemestrialPaper);

router.get("/program-simulare-en-editia-3", matemaratonController.getProgramSimulareEnEditia3);
router.get("/materiale-simulare-en-editia-3", matemaratonController.getMaterialeSimulareEnEditia3);

// contact
router.get("/contact", contactController.getContact);

// exercises
router.get("/exercitii/edit/:code", exerciseController.createOrEditExerciseGet);
router.get("/exercitii/adauga", exerciseController.createOrEditExerciseGet);
router.post("/exercitii/createoredit", exerciseController.createOrEditExercisePost);
router.get("/exercitii/:code", exerciseController.getExerciseByCode);
router.put("/exercitii/statement/:id", exerciseController.updateStatement);
router.get("/exercitii", exerciseController.getExercises);
router.post("/exercitii/katex-preview", exerciseController.createKatekPreview);
router.post("/exercitii/delete", exerciseController.deleteExercise);

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
router.get("/signup/confirm-success", userSignupController.getSignupConfirmSuccess);

// user-change-password
router.get("/change-password", isAuthenticated, userChangePasswordController.getChangePassword);
router.post("/change-password", isAuthenticated, userChangePasswordController.postChangePassword);

// user-reset-password (step1: request, step2: confirmation)
router.get("/reset-password", userResetPasswordController.getResetPassword);
router.post("/reset-password", userResetPasswordController.postResetPassword);
router.get("/reset-password/ask-to-confirm", userResetPasswordController.displayResetPasswordAskToConfirm);
router.get("/reset-password/confirm/:resetPasswordCode", userResetPasswordController.getResetPasswordConfirm);
router.get("/reset-password/confirm-success", userResetPasswordController.getResetPasswordConfirmSuccess);

router.get("/test-id-generator", idGeneratorController.getNextId);

router.get("/editia-[1|2|3]", editionController.getEdition);

module.exports = router;
