const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const userService = require("../../userService");
const userService2 = require("../../user.service");

const strategy = new LocalStrategy(
    {
        usernameField: "email", // the name of fields that we send at login
        passwordField: "password"
    },
    async function (email, password, done) {
        let user;
        try {
            user = await userService2.getOneByEmail(email);
            if (!user) {
                return done(null, false, { message: "Acest email nu este inregistrat." });
            }
            if (!userService.authenticate(password, user.hashedPassword, user.salt)) {
                return done(null, false, { message: "Aceasta parola este incorecta." });
            }
        } catch (e) {
            return done(e);
        }

        // const match = await user.comparePassword(password);
        // if (!match) {
        //     return done(null, false, { message: "Not a matching password" });
        // }

        // console.log(user);

        return done(null, user);

    }
);

passport.use(strategy);

// passport.use(
//     new LocalStrategy(
//         {
//             usernameField: "email", // the name of fields that we send at login
//             passwordField: "password"
//         },
//         function (email, password, done) {
//             userService.getByEmail(email, function (err, user) {
//                 console.log("user");
//                 if (err) return done(err);

//                 if (!user) {
//                     return done(null, false, { message: "Acest email nu este inregistrat." });
//                 }
//                 if (!userService.authenticate(password, user.hashedPassword, user.salt)) {
//                     return done(null, false, { message: "Aceasta parola este incorecta." });
//                 }
//                 return done(null, user);
//             });
//         }
//     )
// );
