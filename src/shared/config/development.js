const constants = require("../constants/core.constants");
const LogLevel = constants.LogLevel;
const LogDetail = constants.LogDetail;

const config = {
    mongo: {
        uri: "mongodb://localhost",
        dbName: "matemaraton-dev"
    },
    rollbarToken: "<rollbarToken>",
    logglyToken: "<logglyToken>",
    logglySubdomain: "<logglySubdomain>",
    logLevel: LogLevel.DEBUG,
    httpLogDetails: {
        request: {
            general: LogDetail.PARTIAL,
            headers: LogDetail.NONE,
            body: false
        },
        response: {
            general: false,
            headers: false,
            body: false
        }
    }
};

module.exports = config;
