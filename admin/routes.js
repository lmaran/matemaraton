const express = require("express");
const router = express.Router();

// Basic Route
// -----------

router.get("/", function(req, res) {
    res.json({
        foo: "admin",
    });
});

router.get("/api", function(req, res) {
    res.json({
        foo: "admin-api",
    });
});

router.get("/err", function(req, res, next) {
    next(new Error("Some Error"));
});

// API Specific 404 / Error Handlers
// ---------------------------------

// API not found
router.use(function(req, res) {
    res.status(404);
    res.send();
});

// errors handler
router.use(function(err, req, res) {
    const status = err.status || 500;
    res.status(status);
    res.json({
        app: "admin",
        status: status,
        error: err.message,
    });
});

module.exports = router;
