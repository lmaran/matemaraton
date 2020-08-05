const express = require("express");
const router = express.Router();
const isAuthenticated = require("./middlewares/is-authenticated.middleware").isAuthenticated;

const upgradeOperationController = require("./controllers/upgrade-operation.controller");
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
const presenceController = require("./controllers/presence.controller");
const courseSessionController = require("./controllers/course-session.controller");
const courseController = require("./controllers/course.controller");
const homeworkController = require("./controllers/homework.controller");
const lessonController = require("./controllers/lesson.controller");

// home
router.get("/", homeController.getHomePage);

router.get("/upgrade-operation", isAuthenticated, upgradeOperationController.upgradeOperation);

// my page
router.get("/pagina-mea", meController.getMyPage);

// class
router.get("/clase/:classId", classController.getClass);

// courses
router.get("/cursuri", courseController.getCourses);
router.get("/cursuri/:id", courseController.getCourse);

router.get("/lectii", lessonController.getLessons);
router.get("/lectii/:lessonId", lessonController.getLesson);
router.get("/cursuri/:courseId/lectii/:lessonId", lessonController.getLesson);

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

// courseSessions
router.get("/clase/:classId/sesiuni-curs", courseSessionController.getCourseSessionsPerClass);
router.get("/clase/:classId/sesiuni-curs/poze", courseSessionController.getCourseSessionsPerClassWithPhotos);
router.get("/sesiuni-curs/:courseSessionId", courseSessionController.getCourseSession);

// students
router.get("/clase/:classId/elevi", studentController.getStudentsPerClass);
router.get("/elevi/:studentId", studentController.getStudent);

// individual pages
router.get("/program-simulare-en-editia-2", matemaratonController.getTrainingProgramForENSimulationEdition2);
router.get("/program-teza-s1-editia-3", matemaratonController.getTrainingProgramForSemestrialPaperEdition3);
router.get("/materiale-teza-s1", matemaratonController.getDocumentsForSemestrialPaper);
router.get("/program-simulare-en-editia-3", matemaratonController.getProgramSimulareEnEditia3);
router.get("/materiale-simulare-en-editia-3", matemaratonController.getMaterialeSimulareEnEditia3);

// contact
router.get("/contact", contactController.getContact);

// exercises
router.get("/exercitii/edit/:code", isAuthenticated, exerciseController.createOrEditExerciseGet);
router.get("/exercitii/adauga", isAuthenticated, exerciseController.createOrEditExerciseGet);
router.post("/exercitii/createoredit", isAuthenticated, exerciseController.createOrEditExercisePost);
router.get("/exercitii/:code", isAuthenticated, exerciseController.getExerciseByCode);
router.put("/exercitii/statement/:id", isAuthenticated, exerciseController.updateStatement);
router.get("/exercitii", isAuthenticated, exerciseController.getExercises);
router.post("/exercitii/katex-preview", isAuthenticated, exerciseController.createKatexPreview);
router.post("/exercitii/delete", isAuthenticated, exerciseController.deleteExercise);

// user-login/logout
router.get("/login", userLoginController.getLogin);
router.post("/login", userLoginController.postLogin);
router.get("/logout", userLogoutController.logout);

// user-signup
router.post("/signup/invite", isAuthenticated, userSignupController.postInviteToSignup);
router.get("/signup/invitation-sent", isAuthenticated, userSignupController.displaySignupInvitationSent);
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

router.get("/editia-[1|2|3]", editionController.getEdition);

module.exports = router;
