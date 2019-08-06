const express = require("express");

const user = require("../user/app");
const api = require("../api/app");
const web = require("../web/app");

// const admin = require("../admin/app");

const app = express();

app.get("/check", function(req, res) {
    res.send("matemaraton-" + (process.env.DEPLOYMENT_SLOT || "noslot") + "-" + process.env.NODE_ENV);
});

app.use("/api", api);
//app.use("/admin", admin);
app.use("/", user);
app.use("/", web);

module.exports = app;
