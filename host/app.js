const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const addUserIfExist = require("./middlewares/addUserIfExist.middleware").addUserIfExist;

const user = require("../user/app");
const api = require("../api/app");
const web = require("../web/app");

const app = express();

// routes for static files; in prod set NGINX to serve them
// app.use("/", express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 })); // one year in milliseconds
app.use("/", express.static(path.join(__dirname, "../public")));
app.use("/lib/lit-html", express.static(path.join(__dirname, "../../node_modules/lit-html")));

app.get("/check", function(req, res) {
    res.send("matemaraton-" + (process.env.DEPLOYMENT_SLOT || "noslot") + "-" + process.env.NODE_ENV);
});

app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object
app.use(addUserIfExist); // verify jwt token and populate req.user (depends on "cookie-parser")

app.use("/api", api);
app.use("/", user);
app.use("/", web);

module.exports = app;
