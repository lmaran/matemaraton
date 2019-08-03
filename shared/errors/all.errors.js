// tslint:disable:max-classes-per-file

// export * from "./approve.controller";

// or use a dedicated module: https://github.com/jshttp/http-errors
// https://medium.com/learn-with-talkrise/custom-errors-with-node-express-27b91fe2d947

// with this module, we can use:
// throw new ApplicationError("Missing tenant", 400);

// ...otherwise, we have to use:
// err = new Error("Missing tenant");
// err.code = 400;
// throw err;

// all these errors are finally caught by an errorHandler middleware

const ApplicationError = require("./application.error");

// export { ApplicationError } from "./application.error";

// https://www.quora.com/Which-HTTP-code-is-best-suited-for-validation-errors-400-or-422
// ex: http:localhost:8080/getDetails?user_id=12345

// Use 400 (BadRequest) if the query is syntactically incorrect
// ex: you do not provide the user_id
class BadRequest extends ApplicationError {
    constructor(message) {
        super(400, message);
    }
}

// Use 422 (Unprocessable Entity) if the query is well formatted but semantically incorrect
// ex: you provide the user_id but it's not valid i.e a -43.67
class ValidationError extends ApplicationError {
    constructor(message) {
        super(400, message);
    }
}

class Unauthorized extends ApplicationError {
    constructor(message) {
        super(401, message);
    }
}

class Forbidden extends ApplicationError {
    constructor() {
        super(403, "Forbidden");
    }
}

// Use 404 (NotFound) if the resource you address in URL is not found
class NotFoundError extends ApplicationError {
    constructor() {
        super(404, "Resursa negasita");
    }
}

class PageNotFound extends ApplicationError {
    constructor(message) {
        super(404, message);
    }
}

module.exports = {
    BadRequest,
    ValidationError,
    Unauthorized,
    Forbidden,
    NotFoundError,
    PageNotFound,
};
