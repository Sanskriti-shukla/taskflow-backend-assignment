class AppError extends Error {
    constructor(httpStatus, message, code, details = {}) {
        super(message);
        this.httpStatus = httpStatus;
        this.code = code;
        this.details = details;
    }
}

module.exports = AppError;
