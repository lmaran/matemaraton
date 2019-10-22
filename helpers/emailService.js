const config = require("../config");
const nodemailer = require("nodemailer");
const Mailgun = require("mailgun-js");

const factory = {};

factory.sendEmail = function(to, subject, body) {
    const mailOptions = {
        from: '"Celebrate Taste" <support@celebrate-taste.ro>',
        to: to,
        subject: subject,
        html: body
    };

    // Zoho
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true, // use SSL
        auth: {
            user: config.zoho.user,
            pass: config.zoho.psw
        }
    });

    const promise = new Promise(function(resolve, reject) {
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) reject(error);
            resolve("ok");
        });
    });

    return promise;

    //     // Mailgun
    //     var mailgun = new Mailgun({ apiKey: config.mailgun.api_key, domain: 'mg.celebrate-taste.ro' });
    //
    //     mailgun.messages().send(emailOptions, function (err, body) {
    //         if (err) {
    //             console.log("got an error: ", err);
    //         } else {
    //             console.log('ok');
    //         }
    //     });
};

module.exports = factory;
