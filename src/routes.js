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
const courseLessonController = require("./controllers/course-lesson.controller");
const courseArticleController = require("./controllers/course-article.controller");
const courseTheoryController = require("./controllers/course-theory.controller");
const courseExerciseController = require("./controllers/course-exercise.controller");
const homeworkController = require("./controllers/homework.controller");
const markdownController = require("./controllers/markdown.controller");
const fileController = require("./controllers/file.controller");
const enrollmentController = require("./controllers/enrollment.controller");
const resourcesController = require("./controllers/resources.controller");
const sheetController = require("./controllers/sheet.controller");

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

// courses
router.get("/cursuri", courseController.getAll);
router.get("/cursuri/:id/json", isAuthenticated, courseController.jsonGetOneById);
router.get("/cursuri/:id/modifica", isAuthenticated, courseController.createOrEditGet);
router.post("/cursuri/:id/modifica", isAuthenticated, courseController.createOrEditPost);
router.get("/cursuri/adauga", isAuthenticated, courseController.createOrEditGet);
router.post("/cursuri/adauga", isAuthenticated, courseController.createOrEditPost);
router.get("/cursuri/modifica", isAuthenticated, courseController.createOrEditListGet);
router.get("/cursuri/json", isAuthenticated, courseController.jsonGetAll);
//router.post("/cursuri/modifica", isAuthenticated, courseController.createOrEditListPost);
router.get("/cursuri/:id", courseController.getOneById);
router.get("/cursuri/:id/capitole", isAuthenticated, courseController.getOneById); // only for url access
router.post("/cursuri/:id/sterge", isAuthenticated, courseController.deleteOneById);

// course-chapters
router.get("/cursuri/:courseId/capitole/adauga", isAuthenticated, courseChapterController.createOrEditGet);
router.post("/cursuri/:courseId/capitole/adauga", isAuthenticated, courseChapterController.createOrEditPost);
router.get("/cursuri/:courseId/capitole/:chapterId", courseChapterController.getOneById);
router.get("/cursuri/:courseId/capitole/:chapterId/json", isAuthenticated, courseChapterController.jsonGetOneById);
router.get("/cursuri/:courseId/capitole/:chapterId/modifica", isAuthenticated, courseChapterController.createOrEditGet);
router.post("/cursuri/:courseId/capitole/:chapterId/modifica", isAuthenticated, courseChapterController.createOrEditPost);
router.post("/cursuri/:courseId/capitole/:chapterId/sterge", isAuthenticated, courseChapterController.deleteOneById);

// course-lessons
router.get("/cursuri/:courseId/capitole/:chapterId/lectii/adauga", isAuthenticated, courseLessonController.createGet);
router.post("/cursuri/:courseId/capitole/:chapterId/lectii/adauga", isAuthenticated, courseLessonController.createPost);
router.get("/cursuri/:courseId/lectii/:lessonId", courseLessonController.getOneById);
router.get("/cursuri/:courseId/lectii/:lessonId/json", isAuthenticated, courseLessonController.jsonGetOneById);
router.get("/cursuri/:courseId/lectii/:lessonId/modifica", isAuthenticated, courseLessonController.editGet);
router.post("/cursuri/:courseId/lectii/:lessonId/modifica", isAuthenticated, courseLessonController.editPost);
router.post("/cursuri/:courseId/lectii/:lessonId/sterge", isAuthenticated, courseLessonController.deleteOneById);

// course-sheet
router.get("/cursuri/:courseId/lectii/:lessonId/fise/adauga", isAuthenticated, sheetController.createGet);
router.post("/cursuri/:courseId/lectii/:lessonId/fise/adauga", isAuthenticated, sheetController.createPost);
router.get("/cursuri/:courseId/lectii/:lessonId/fise/:sheetId", isAuthenticated, sheetController.getOneById);

// course-articles
router.get("/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/articole/adauga", isAuthenticated, courseArticleController.createOrEditGet);
router.post("/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/articole/adauga", isAuthenticated, courseArticleController.createOrEditPost);
router.get(
    "/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/articole/:articleId/modifica",
    isAuthenticated,
    courseArticleController.createOrEditGet
);
router.post(
    "/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/articole/:articleId/modifica",
    isAuthenticated,
    courseArticleController.createOrEditPost
);

// course-theory
router.get("/cursuri/:courseId/lectii/:lessonId/teorie", courseTheoryController.getOneById);

// course-exercise
router.get(
    "/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/sectiuni/:sectionId/niveluri/:levelId/exercitii/adauga",
    isAuthenticated,
    courseExerciseController.createGet
);
router.post(
    "/cursuri/:courseId/capitole/:chapterId/lectii/:lessonId/sectiuni/:sectionId/niveluri/:levelId/exercitii/adauga",
    isAuthenticated,
    courseExerciseController.createPost
);
router.get("/cursuri/:courseId/exercitii/:exerciseId", courseExerciseController.getOneById);
router.get("/cursuri/:courseId/exercitii/:exerciseId/modifica", isAuthenticated, courseExerciseController.editGet);
router.post("/cursuri/:courseId/exercitii/:exerciseId/modifica", isAuthenticated, courseExerciseController.editPost);
router.get("/cursuri/:courseId/exercitii/:exerciseId/muta", isAuthenticated, courseExerciseController.moveGet);
router.post("/cursuri/:courseId/exercitii/:exerciseId/muta", isAuthenticated, courseExerciseController.movePost);
router.post("/cursuri/:courseId/exercitii/:exerciseId/sterge", isAuthenticated, courseExerciseController.deleteOneById);
router.get("/cursuri/:courseId/exercitii/:exerciseId/json", isAuthenticated, courseExerciseController.jsonGet);
router.post("/cursuri/:courseId/exercitii/:exerciseId/upload-files", isAuthenticated, courseExerciseController.uploadFiles);
router.post("/cursuri/:courseId/exercitii/upload-files", isAuthenticated, courseExerciseController.uploadFiles);
//router.post("/cursuri/:courseId/capitole/:chapterId/lectii/adauga", isAuthenticated, courseLessonController.createOrEditPost);
router.get("/cursuri/:courseId/available-lessons", isAuthenticated, courseExerciseController.getAvailableLessons);
router.get(
    "/cursuri/:courseId/lectii/:lessonId/sectiuni/:sectionId/niveluri/:levelId/exercise/:exerciseId/available-positions",
    isAuthenticated,
    courseExerciseController.getAvailablePositions
);

// exercises
router.get("/exercitii", isAuthenticated, exerciseController.getAll);
router.get("/exercitii/:id/modifica", isAuthenticated, exerciseController.createOrEditGet);
router.post("/exercitii/:id/modifica", isAuthenticated, exerciseController.createOrEditPost);
router.get("/exercitii/adauga", isAuthenticated, exerciseController.createOrEditGet);
router.post("/exercitii/adauga", isAuthenticated, exerciseController.createOrEditPost);
router.post("/exercitii/sterge", isAuthenticated, exerciseController.deleteOneById);
router.get("/exercitii/:id", exerciseController.getOneById);
router.post("/exercitii/:id/rezolvari", isAuthenticated, exerciseController.addMySolution);

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
router.delete("/fisiere/:fileId", fileController.deleteOneById);

module.exports = router;
