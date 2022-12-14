const httpHelper = require("../helpers/http.helper");
const config = require("../config");

exports.checkResponse = async (token) => {
    const options = {
        host: "www.google.com",
        method: "POST",
        path: `/recaptcha/api/siteverify?secret=${config.recaptchaSecretKey}&response=${token}`,
    };

    return httpHelper.request(options);
};
