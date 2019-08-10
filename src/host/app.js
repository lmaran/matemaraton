const express = require("express");
const path = require("path");

const user = require("../user/app");
const api = require("../api/app");
const web = require("../web/app");

// const admin = require("../admin/app");

const app = express();

// routes for static files; in prod set NGINX to serve it
app.use(express.static(path.join(__dirname, "../public")));

app.get("/check", function(req, res) {
    res.send("matemaraton-" + (process.env.DEPLOYMENT_SLOT || "noslot") + "-" + process.env.NODE_ENV);
});

app.use("/api", api);
//app.use("/admin", admin);
app.use("/", user);
app.use("/", web);

module.exports = app;
