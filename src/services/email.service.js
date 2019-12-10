const mailgun = require("mailgun-js");
const config = require("../config");

const mg = mailgun({
    apiKey: config.mailgun_apiKey,
    domain: config.mailgun_domain,
    host: config.mailgun_host
});

exports.sendEmail = async data => {
    try {
        data.from = data.from || config.mailgun_defaultSender;
        return await mg.messages().send(data);
        // return object has 2 props: { id: '<20191210111542.1.95B2BBE5BFCBA804@mg.matemaraton.ro>',message: 'Queued. Thank you.' }
        // if needed, we can store the "id" for an email an later check the status for this email
        // https://help.mailgun.com/hc/en-us/articles/360012289953-How-to-Find-a-Message-ID
    } catch (error) {
        throw new Error(error); // re-throw the error
    }
};
