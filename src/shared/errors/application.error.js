// or use a dedicated npm module (like http-errors): https://github.com/jshttp/http-errors
// https://medium.com/learn-with-talkrise/custom-errors-with-node-express-27b91fe2d947

// with this module, we can use:
// throw new ApplicationError("Missing tenant", 400);

// ...otherwise, we have to use:
// err = new Error("Missing tenant");
// err.code = 400;
// throw err;

// all these errors are finally caught by an errorHandler middleware

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
// https://stackoverflow.com/a/32749533
// https://www.loggly.com/blog/node-js-error-handling/

// import { IErrorOptions } from "../interfaces";
//const ReturnType =require("../constants");

class ApplicationError extends Error {
    // instance fields with default values
    //  _status = 500;
    //  _developerMessage;
    //  _returnAs;
    //  _redirectUri;

    constructor(status, message) {
        super(message);
        this.name = this.constructor.name;
        this._status = status || 500;

        // Capture the current stack trace and store it in the property "this.stack".
        Error.captureStackTrace(this, this.constructor);
    }

    // getters, setters and chaining methods
    get status() {
        return this._status;
    }
    set status(status) {
        this._status = status;
    }
    withStatus(status) {
        this._status = status;
        return this;
    }

    get developerMessage() {
        return this._developerMessage;
    }
    set developerMessage(developerMessage) {
        this._developerMessage = developerMessage;
    }
    withDeveloperMessage(developerMessage) {
        this._developerMessage = developerMessage;
        return this;
    }

    get returnAs() {
        return this._returnAs;
    }
    set returnAs(returnAs) {
        this._returnAs = returnAs;
    }
    withReturnAs(returnAs) {
        this._returnAs = returnAs;
        return this;
    }

    get redirectUri() {
        return this._redirectUri;
    }
    set redirectUri(redirectUri) {
        this._redirectUri = redirectUri;
    }
    withRedirectUri(uri) {
        this._redirectUri = uri;
        return this;
    }
}

module.exports = ApplicationError;
