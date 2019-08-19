const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const addUserIfExist = require("./middlewares/addUserIfExist.middleware").addUserIfExist;

const user = require("../user/app");
const api = require("../api/app");
const web = require("../web/app");
const mongoHelper = require("../shared/helpers/mongo.helper");

const app = express();

const mongoClientAsPromise = mongoHelper.init();

// routes for static files; in prod set NGINX to serve them
// app.use("/", express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 })); // one year in milliseconds
app.use("/", express.static(path.join(__dirname, "../public")));
app.use("/lib/lit-html", express.static(path.join(__dirname, "../../node_modules/lit-html")));

app.get("/check", function(req, res) {
    res.send("matemaraton-" + (process.env.DEPLOYMENT_SLOT || "noslot") + "-" + process.env.NODE_ENV);
});

app.use(
    session({
        secret: "foo",
        resave: false,
        saveUninitialized: true,
        store: new MongoStore({ clientPromise: mongoClientAsPromise })
    })
);
app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object
app.use(addUserIfExist); // verify jwt token and populate req.user (depends on "cookie-parser")

app.use("/api", api);
app.use("/", user);
app.use("/", web);

app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

module.exports = app;
