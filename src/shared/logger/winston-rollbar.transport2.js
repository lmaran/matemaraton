// https://github.com/GorillaStack/winston-rollbar/blob/master/lib/rollbar_transport.js
/**
 * Rollbar Transport
 *
 * A rollbar transport for winston.
 */

const winston = require("winston");
const rollbar = require("rollbar");
// const cycle = require("cycle");

exports.Rollbar = winston.transports.Rollbar = class extends winston.Transport {
    constructor(opts = {}) {
        super(opts);
        if (!opts.rollbarConfig.accessToken) {
            throw "winston-transport-rollbar requires a 'rollbarConfig.accessToken' property";
        }

        const _rollbar = new rollbar(opts.rollbarConfig);

        this.name = "rollbar";
        this.level = opts.level || "warn";
        this.metadataAsRequest = opts.metadataAsRequest || false;
        this.silent = opts.silent || false;
        this.rollbar = _rollbar;
        this.handleExceptions = opts.handleExceptions || false;
    }

    /**
     * Attempt to log to the given log level, otherwise log at the default level and include the level
     * @param {String} level
     * @param {Array} args
     */
    performLogging(level, ...args) {
        const logMethod = this.rollbar[level];
        if (logMethod) {
            logMethod.apply(this.rollbar, args);
        } else {
            args[2].logLevel = level;
            this.rollbar.log(...args);
        }
    }

    /**
     * Core logging method exposed to Winston. Metadata is optional.
     * @method log
     * @param level {string} Level at which to log the message
     * @param msg {string} Message to log
     * @param meta {Object} **Optional** Additional metadata to attach
     * @param callback {function} Continuation to respond to when complete.
     */
    log(level, msg, meta, callback) {
        const self = this;
        if (this.silent) {
            return callback(null, true);
        }

        let req = null;
        if (typeof meta === "string") {
            meta = { message: meta };
        }
        if (this.metadataAsRequest) {
            if (req && req.socket) {
                req = meta;
            }
        } else if (meta && meta.req) {
            if (typeof meta.req === "function") {
                req = meta.req();
            } else {
                req = meta.req;
            }
        }

        const cb = err => {
            if (err) {
                return callback(err);
            }

            self.emit("logged");
            callback(null, true);
        };

        if (["warn", "error"].indexOf(level) > -1 && (msg instanceof Error || meta instanceof Error)) {
            var error;
            meta.level = meta.level || level;
            if (meta.level === "warn") {
                meta.level = "warning";
            }
            if (msg instanceof Error) {
                error = msg;
            } else {
                error = meta;
            }

            this.performLogging(level, error, req, meta, cb);
        } else {
            // const custom = typeof meta === "object" ? cycle.decycle(meta) : meta;
            // this.performLogging(level, msg, req, custom, cb);
        }
    }
};
