const { createLogger, format, transports } = require("winston");
import * as chalk from "chalk";
import config from "../config";
import { LogDetail, LogSource } from "../constants";

export const formatterFunc = options => {
    // The return string will be passed to logger.
    const meta = options.meta;
    const message = options.message;
    let msg = "";

    if (meta.logSource === LogSource.HTTP_LOG_HANDLER) {
        // one-line log message
        if (meta.req) {
            msg = msg + meta.req.method + " " + meta.req.url;
            if (meta.res) {
                msg = msg + " " + getColorStatus(meta.res.statusCode) + " - " + meta.res.responseTime + " ms ";
            }
        }

        // if more details are required, display also the meta object (full req/res)
        const reqDetails = config.httpLogDetails && config.httpLogDetails.request;
        const resDetails = config.httpLogDetails && config.httpLogDetails.response;
        if (reqDetails && resDetails) {
            if (
                reqDetails.general === LogDetail.FULL ||
                (reqDetails.headers === LogDetail.PARTIAL || reqDetails.headers === LogDetail.FULL) ||
                reqDetails.body ||
                resDetails.headers ||
                resDetails.body
            ) {
                msg = msg + "\n" + JSON.stringify(meta, null, 4);
            }
        }
    } else if (meta.logSource === LogSource.ERROR_HANDLER) {
        msg = msg + (undefined !== message ? message : "");
        if (meta && Object.keys(meta).length > 0) {
            const stack = meta.stack;
            if (stack) {
                delete meta.stack;
            }
            msg = msg + "\n" + JSON.stringify(meta, null, 4);

            if (stack) {
                msg = msg + "\n" + stack;
            }
        }
    } else {
        // logSource === LogSource.CODE
        msg = msg + (undefined !== message ? message : "");
        if (meta && Object.keys(meta).length > 0) {
            const stack = meta.stack;
            if (stack) {
                delete meta.stack;
            }
            msg = msg + "\n" + JSON.stringify(meta, null, 4);

            if (stack) {
                msg = msg + "\n" + stack;
            }
        }
    }

    return format.colorize(options.level) + " " + msg;
};

function getColorStatus(status) {
    console.log("status: " + status);
    let statusColor = "green";
    if (status >= 500) {
        statusColor = "red";
    } else if (status >= 400) {
        statusColor = "yellow";
    } else if (status >= 300) {
        statusColor = "cyan";
    }

    return chalk[statusColor](status);
}
