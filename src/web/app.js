const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");

const routes = require("./routes");
const auth = require("../shared/user/login/loginService");
const handlebarHelpers = require("../shared/helpers/handlebar.helper");
const setContext = require("../shared/middlewares/setContext.middleware").setContext;

const app = express();

// view engine setup
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "/views"));
app.engine(
    ".hbs",
    exphbs({
        defaultLayout: "main",
        extname: ".hbs",
        layoutsDir: path.join(__dirname, "../shared/views/layouts/"),
        partialsDir: path.join(__dirname, "../shared/views/partials/"),

        helpers: handlebarHelpers
    })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object
app.use(passport.initialize());

app.use(auth.addUserIfExist());
app.use(setContext); // adds requestId, tokenCode and other properties to the request object

// routes for static files
app.use(express.static(path.join(__dirname, "../shared/public")));
app.use("/views", express.static(path.join(__dirname, "views")));
app.use("/scripts/lit-html", express.static(path.join(__dirname, "../../node_modules/lit-html")));

app.use("/", routes);

module.exports = app;
