const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const userService = require("../services/user.service");
const authHelper = require("../helpers/auth.helper");

const localStrategy = new LocalStrategy(
    {
        usernameField: "email", // the name of fields that we send at login
        passwordField: "password"
    },
    async (email, password, done) => {
        let user;
        try {
            user = await userService.getOneByEmail(email.toLowerCase());
            if (!user) {
                return done(null, false, { message: "Acest email nu este inregistrat." });
            }
            if (!authHelper.authenticate(password, user.hashedPassword, user.salt)) {
                return done(null, false, { message: "Email sau parola este incorecta." });
            }
        } catch (e) {
            return done(e);
        }

        return done(null, user);
    }
);

passport.use(localStrategy);
