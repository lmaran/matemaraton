// we use v2.x version of winston (as v3.x in still in RC )

// common signature:
//      logger.info("message", meta); where:
//          meta is an optional object
//          log levels: error-0, warn-1, info-2, debug-3 (we use only 4)

// source                   | format                                  | dest
// ----------------------------------------------------------------------------
// Server err handler (5xx) | log.error("serverError", {err}          | Rollbar
// Unhandled err. handler:  | log.error("unhandledError", {err})      | Rollbar
// Code (warn)              | log.warn("message", {optional-meta})    | Rollbar
// ----------------------------------------------------------------------------
// Code (info)              | log.info("message", {optional-meta})    | Loggly
// Code (debug)             | log.debug("message", {optional-meta})   | Loggly
// HttpLogHandler           | log.info("httpLogHandler", {req, res})  | Loggly
// Client err handler (4xx) | log.info("clientError", {err})          | Loggly

const { createLogger, format, transports } = require("winston");
import config from "../config";
import { EnvironmentType, LogLevel } from "../constants";
// import { formatterFunc } from "./winston-console.formatter";
import { Rollbar } from "./winston-rollbar.transport2";
// const { Loggly } = require("./winston-loggly.transport2");

const rollbarOptions = {
    accessToken: config.rollbarToken,
    reportLevel: LogLevel.WARNING, // catches just errors and warnings; default: "warning"
    environment: config.env,
    scrubFields: ["password", "oldPassword", "newPassword", "hashedPassword", "salt"],
};

// const logglyOptions = {
//     token: config.logglyToken,
//     subdomain: config.logglySubdomain,
//     tags: ["cantinas", config.env],
//     json: true,
// };

const logger = createLogger({});

// Winston && Rollbar: debug > info > warning > error
// E.g. 'info' level catches also 'warning' or 'error' but not 'debug'

if (config.env === EnvironmentType.PRODUCTION || config.env === EnvironmentType.STAGING) {
    // logger.add(new Loggly(logglyOptions));
    logger.add(new Rollbar({ rollbarConfig: rollbarOptions }));
} else {
    // development
    const formatterFunc = require("./winston-console.formatter").formatterFunc;

    // Ignore log messages if they have { private: true }
    const ignorePrivate = format((info, opts) => {
        if (info.private) {
            return false;
        }
        return info;
    });

    const myFormat = format.printf(info => {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    });

    const consoleOptions = {
        level: LogLevel.DEBUG, // catches all messages
        // formatter: formatterFunc,
        // format: format.json(),
        // format: format.combine(ignorePrivate(), format.simple()),
        // format: format.combine(format.label({ label: "right meow!" }), format.timestamp(), myFormat),
    };
    // console.log("status1234:  + status" + formatterFunc);
    logger.add(new transports.Console(consoleOptions));
}

export default logger;
