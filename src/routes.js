const express = require("express");
const router = express.Router();
const isAuthenticated = require("./middlewares/is-authenticated.middleware").isAuthenticated;

const upgradeOperationController = require("./controllers/upgrade-operation.controller");
const homeController = require("./controllers/home.controller");
const contactController = require("./controllers/contact.controller");
const editionController = require("./controllers/edition.controller");
const meController = require("./controllers/me.controller");
const matemaratonController = require("./controllers/matemaraton.controller");
const exerciseController = require("./controllers/exercise.controller");
const classController = require("./controllers/class.controller");
const studentController = require("./controllers/student.controller");
const parentController = require("./controllers/parent.controller");
const userController = require("./controllers/user.controller");
const userResetPasswordController = require("./controllers/user-reset-password.controller");
const userChangePasswordController = require("./controllers/user-change-password.controller");
const userSignupController = require("./controllers/user-signup.controller");
const userLoginController = require("./controllers/user-login.controller");
const userLogoutController = require("./controllers/user-logout.controller");
const presenceController = require("./controllers/presence.controller");
const courseSessionController = require("./controllers/course-session.controller");
const courseController = require("./controllers/course.controller");
const courseChapterController = require("./controllers/course-chapter.controller");
const lessonController = require("./controllers/lesson.controller");
const homeworkController = require("./controllers/homework.controller");
const markdownController = require("./controllers/markdown.controller");
const fileController = require("./controllers/file.controller");
const enrollmentController = require("./controllers/enrollment.controller");
const resourcesController = require("./controllers/resources.controller");
const sheetController = require("./controllers/sheet.controller");
const sectionController = require("./controllers/section.controller");

// home
router.get("/", homeController.getHomePage);
router.get("/contact", contactController.getContactPage);

router.get("/upgrade-operation", isAuthenticated, upgradeOperationController.upgradeOperation);

// enrollments
router.get("/clase/:classId/inscrieri", enrollmentController.getAllPerClass);
router.get("/clase/:classId/inscrieri/adauga", enrollmentController.enrollInClassGet);
router.post("/clase/:classId/inscrieri/adauga", isAuthenticated, enrollmentController.enrollInClassPost);

// router.get("/inscriere", enrollmentController.enrollInClassGet);
// router.post("/inscriere", enrollmentController.enrollInClassPost);

// my page
router.get("/pagina-mea", meController.getMyPage);

// resources
router.get("/materiale", resourcesController.getAll);

// classes
router.get("/clase", classController.getAll);
router.get("/clase/:id/modifica", isAuthenticated, classController.createOrEditGet);
router.post("/clase/:id/modifica", isAuthenticated, classController.createOrEditPost);
router.put("/clase/:id/descriere", isAuthenticated, classController.saveDescription);
router.get("/clase/adauga", isAuthenticated, classController.createOrEditGet);
router.post("/clase/adauga", isAuthenticated, classController.createOrEditPost);
router.get("/clase/:classId", classController.getOneById);
router.post("/clase/:id/sterge", isAuthenticated, classController.deleteOneById);

// fișe cu exerciții
router.get("/fise", sheetController.getAll);
router.get("/fise/adauga", isAuthenticated, sheetController.createGet);
router.post("/fise/adauga", isAuthenticated, sheetController.createPost);
router.get("/fise/:sheetId", sheetController.getOneById);
router.get("/fise/:sheetId/modifica", sheetController.updateGet);
router.post("/fise/:sheetId/modifica", sheetController.updatePost);
router.post("/fise/:sheetId/sterge", isAuthenticated, sheetController.deleteOneById);
router.get("/fise/:sheetId/json", sheetController.jsonGetOneById);

// sections
router.get("/sectiuni", sectionController.getAll);
router.get("/sectiuni/modifica", isAuthenticated, sectionController.createOrEditListGet);
router.get("/sectiuni/adauga", isAuthenticated, sectionController.createOrEditGet);
router.post("/sectiuni/adauga", isAuthenticated, sectionController.createOrEditPost);
router.get("/sectiuni/json", isAuthenticated, sectionController.jsonGetAll);
router.get("/sectiuni/:sectionId", sectionController.getOneById);
router.get("/sectiuni/:sectionId/modifica", isAuthenticated, sectionController.createOrEditGet);
router.post("/sectiuni/:sectionId/modifica", isAuthenticated, sectionController.createOrEditPost);
router.get("/sectiuni/:sectionId/json", isAuthenticated, sectionController.jsonGetOneById);
router.post("/sectiuni/:sectionId/sterge", isAuthenticated, sectionController.deleteOneById);
router.get("/sectiuni/:sectionId/available-positions", isAuthenticated, sectionController.getAvailablePositions);

// courses
router.get("/cursuri", courseController.getAll);
router.get("/cursuri/adauga", isAuthenticated, courseController.createOrEditGet);
router.post("/cursuri/adauga", isAuthenticated, courseController.createOrEditPost);
router.get("/cursuri/modifica", isAuthenticated, courseController.createOrEditListGet);
router.get("/cursuri/json", isAuthenticated, courseController.jsonGetAll);
//router.post("/cursuri/modifica", isAuthenticated, courseController.createOrEditListPost);
router.get("/cursuri/:courseId/json", isAuthenticated, courseController.jsonGetOneById);
router.get("/cursuri/:courseId/modifica", isAuthenticated, courseController.createOrEditGet);
router.post("/cursuri/:courseId/modifica", isAuthenticated, courseController.createOrEditPost);
router.get("/cursuri/:courseId", courseController.getOneById);
router.get("/cursuri/:courseId/capitole", isAuthenticated, courseController.getOneById); // only for url access
router.get("/cursuri/:courseId/available-chapters", isAuthenticated, courseController.getAvailableChapters);
router.get(
    "/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/available-chapter-lessons",
    isAuthenticated,
    courseController.getAvailableChapterLessons
);
router.post("/cursuri/:courseId/sterge", isAuthenticated, courseController.deleteOneById);

// course-chapters
router.get("/cursuri/:courseId/capitole/adauga", isAuthenticated, courseChapterController.createOrEditGet);
router.post("/cursuri/:courseId/capitole/adauga", isAuthenticated, courseChapterController.createOrEditPost);
router.get("/cursuri/:courseId/capitole/:chapterId", courseChapterController.getOneById);
router.get("/cursuri/:courseId/capitole/:chapterId/json", isAuthenticated, courseChapterController.jsonGetOneById);
router.get("/cursuri/:courseId/capitole/:chapterId/modifica", isAuthenticated, courseChapterController.createOrEditGet);
router.post("/cursuri/:courseId/capitole/:chapterId/modifica", isAuthenticated, courseChapterController.createOrEditPost);
router.post("/cursuri/:courseId/capitole/:chapterId/sterge", isAuthenticated, courseChapterController.deleteOneById);

// lessons
router.get("/lectii/adauga", isAuthenticated, lessonController.createGet);
router.post("/lectii/adauga", isAuthenticated, lessonController.createPost);
router.get("/lectii/:lessonId", lessonController.getOneById);
router.get("/lectii/:lessonId/json", isAuthenticated, lessonController.jsonGetOneById);
router.get("/lectii/:lessonId/modifica", isAuthenticated, lessonController.editGet);
router.post("/lectii/:lessonId/modifica", isAuthenticated, lessonController.editPost);
router.get("/lectii/:lessonId/muta", isAuthenticated, lessonController.moveGet);
router.post("/lectii/:lessonId/muta", isAuthenticated, lessonController.movePost);
router.post("/lectii/:lessonId/sterge", isAuthenticated, lessonController.deleteOneById);
router.post("/lectii/:lessonId/upload-files", isAuthenticated, lessonController.uploadFiles);
router.delete(`/lectii/fisiere/:fileId`, lessonController.deleteFileById); // delete at create
router.delete(`/lectii/:lessonId/fisiere/:fileId`, lessonController.deleteFileById); // delete at edit

// exercises
router.get("/exercitii", isAuthenticated, exerciseController.getAll);
router.get("/exercitii/adauga", isAuthenticated, exerciseController.createGet);
router.post("/exercitii/adauga", isAuthenticated, exerciseController.createPost);
router.get("/exercitii/:exerciseId", exerciseController.getOneById);
router.get("/exercitii/:exerciseId/modifica", isAuthenticated, exerciseController.editGet);
router.post("/exercitii/:exerciseId/modifica", isAuthenticated, exerciseController.editPost);
router.get("/exercitii/:exerciseId/muta", isAuthenticated, exerciseController.moveGet);
router.post("/exercitii/:exerciseId/muta", isAuthenticated, exerciseController.movePost);
router.post("/exercitii/:exerciseId/sterge", isAuthenticated, exerciseController.deleteOneById);
router.get("/exercitii/:exerciseId/json", isAuthenticated, exerciseController.jsonGet);
router.post("/exercitii/:exerciseId/upload-files", isAuthenticated, exerciseController.uploadFiles);
router.post("/exercitii/upload-files", isAuthenticated, exerciseController.uploadFiles);
router.delete(`/exercitii/fisiere/:fileId`, exerciseController.deleteFileById); // delete at create
router.delete(`/exercitii/:exerciseId/fisiere/:fileId`, exerciseController.deleteFileById); // delete at edit

router.get("/cursuri/:courseId/available-lessons", isAuthenticated, exerciseController.getAvailableLessons);
router.get(
    "/cursuri/:courseId/lectii/:lessonId/niveluri/:levelId/exercise/:exerciseId/available-positions",
    isAuthenticated,
    exerciseController.getAvailablePositions
);

// markdown
router.post("/markdown/get-rendered-markdown", isAuthenticated, markdownController.getGetRenderedMarkdown);

// presence
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
router.get("/sesiuni-curs/edit/:id", isAuthenticated, courseSessionController.createOrEditGet);
router.post("/sesiuni-curs/edit/:id", isAuthenticated, courseSessionController.createOrEditPost);
router.get("/clase/:classId/sesiuni-curs/poze", courseSessionController.getCourseSessionsPerClassWithPhotos);
router.get("/sesiuni-curs/:courseSessionId", courseSessionController.getCourseSession);
router.get("/clase/:classId/sesiuni-curs/adauga", isAuthenticated, courseSessionController.createOrEditGet);
router.post("/clase/:classId/sesiuni-curs/adauga", isAuthenticated, courseSessionController.createOrEditPost);
router.post("/sesiuni-curs/sterge", isAuthenticated, courseSessionController.deleteOneById);

// students
router.get("/clase/:classId/elevi", studentController.getStudentsPerClass);
router.get("/elevi/:studentId", studentController.getStudent);

// utilizatori
router.get("/utilizatori", isAuthenticated, userController.getAll);
router.get("/utilizatori/:id", isAuthenticated, userController.getOneById);
router.post("/utilizatori/:id/sterge", isAuthenticated, userController.deleteOneById);

// individual pages
router.get("/program-simulare-en-editia-2", matemaratonController.getTrainingProgramForENSimulationEdition2);
router.get("/program-teza-s1-editia-3", matemaratonController.getTrainingProgramForSemestrialPaperEdition3);
router.get("/materiale-teza-s1", matemaratonController.getDocumentsForSemestrialPaper);
router.get("/program-simulare-en-editia-3", matemaratonController.getProgramSimulareEnEditia3);
router.get("/materiale-simulare-en-editia-3", matemaratonController.getMaterialeSimulareEnEditia3);

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

router.get("/editia-[1|2|3|4|5]", editionController.getEdition);

// file
router.get("/fisiere", fileController.getAll);
router.delete("/fisiere/:fileId", fileController.deleteOneById);
router.get("/fisiere/:fileId", fileController.getOneById);
router.get("/fisiere/:fileId/json", fileController.jsonGetOneById);

module.exports = router;
