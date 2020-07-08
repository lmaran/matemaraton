// import { EnvironmentType, LogDetail, LogLevel } from "../constants";
const constants = require("../constants/core.constants");
const LogLevel = constants.LogLevel;
const LogDetail = constants.LogDetail;
const EnvironmentType = constants.EnvironmentType;

let env = (process.env.NODE_ENV || EnvironmentType.DEVELOPMENT).toLowerCase();
if (env === "test") {
    // jest sets this env variable as "test"
    // we can also create a test.js file in the config folder but have to exclude it from testing (as it ends in *test.js)
    env = EnvironmentType.DEVELOPMENT.toLowerCase();
}
const envConfig = require(`./${env}`);

const common = {
    env,
    port: process.env.PORT || 1416,
    mongo_uri: process.env.MONGO_URI,
    mongo_dbName: process.env.MONGO_DB_NAME,
    mailgun_key: process.env.MAILGUN_KEY,
    mailgun_domain: "mg.matemaraton.ro",
    mailgun_host: "api.eu.mailgun.net",
    mailgun_defaultSender: "MateMaraton <info@matemaraton.ro>",
    session_secret: process.env.SESSION_SECRET,
    rollbarToken: process.env.ROLLBAR_TOKEN,
    logglyToken: process.env.LOGGLY_TOKEN,
    logglySubdomain: process.env.LOGGLY_SUBDOMAIN,
    loginCookieMaxAge: 60 * 60 * 24 * 30, // (30 days; in seconds),
    loginJwtTokenExpiresIn: 60 * 15, // (15 minutes; in seconds),

    logLevel: process.env.LOG_LEVEL || LogLevel.WARNING,

    httpLogDetails: {
        request: {
            general: process.env.HTTP_LOG_DETAILS_REQUEST_GENERAL || LogDetail.FULL,
            headers: process.env.HTTP_LOG_DETAILS_REQUEST_HEADERS || LogDetail.PARTIAL,
            body: process.env.HTTP_LOG_DETAILS_REQUEST_BODY || false
        },
        response: {
            general: process.env.HTTP_LOG_DETAILS_RESPONSE_GENERAL || false,
            headers: process.env.HTTP_LOG_DETAILS_RESPONSE_HEADERS || false,
            body: process.env.HTTP_LOG_DETAILS_RESPONSE_BODY || false
        }
    },

    // List of user roles
    userRoles: ["guest", "user", "partner", "admin"], // the order is important

    externalUrl: "http://localhost:1417",
    azureBlobStorageConnectionString: process.env.AZURE_BLOB_STORAGE_CONNECTION_STRING || "",
    idGenerator: { defaultBatchSize: 10, specificBatchSize: { exercises: 1 } }
};

// Merge a `source` object to a `target` recursively
// https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6
const merge = (target, source) => {
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object) Object.assign(source[key], merge(target[key], source[key]));
    }

    // Join `target` and modified `source`
    Object.assign(target || {}, source);
    return target;
};

// merge the two config objects
const config = merge(common, envConfig);

module.exports = config;
