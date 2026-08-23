function Response(code, status, description, errorCode) {
    this.code = code;
    this.status = status;
    this.description = description;
    this.errorCode = errorCode;
}

function getOkResponse(message) {
    return new Response(200, 'OK', message);
}

function getCreatedResponse(message) {
    return new Response(201, 'CREATED', message);
}

function getDeletedResponse(message) {
    return new Response(200, 'DELETED', message);
}

function getErrorResponse(httpStatus, message, errorCode) {
    return new Response(httpStatus || 500, 'ERROR', message || 'Something went wrong', errorCode || 'INTERNAL_SERVER_ERROR');
}

function getInternalServerErrorResponse() {
    return getErrorResponse(500, 'Something went wrong', 'INTERNAL_SERVER_ERROR');
}

module.exports = {
    getOkResponse,
    getCreatedResponse,
    getDeletedResponse,
    getErrorResponse,
    getInternalServerErrorResponse
};
