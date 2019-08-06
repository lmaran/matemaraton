const express = require("express");
const router = express.Router();

const homeController = require("./controllers/home.controller");
const meController = require("./controllers/me.controller");
const matemaratonController = require("../web/controllers/matemaraton.controller");
const problemController = require("../web/controllers/problem.controller");

const contactController = require("./controllers/contact.controller");
const pageController = require("./controllers/page.controller");

// home
router.get("/", homeController.getHomePage);

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
