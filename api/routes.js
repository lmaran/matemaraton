const express = require("express");
const router = express.Router();

// Basic Route
// -----------

router.get("/", function(req, res) {
    res.send("Public API - not implemented");
});

router.get("/err", function(req, res, next) {
    next(new Error("Some Error"));
});

// API Specific 404 / Error Handlers
// ---------------------------------

// check also: https://github.com/icebob/vue-express-mongo-boilerplate/blob/master/server/routes/errors.js

// API not found
router.use(function(req, res) {
    res.status(404);
    res.send("Public API - not found");
});

// errors handler
router.use(function(err, req, res) {
    const status = err.status || 500;
    res.status(status);
    res.json({
        app: "api",
        status: status,
        error: err.message,
    });
});

module.exports = router;
