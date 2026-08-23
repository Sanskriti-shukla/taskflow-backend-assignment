const toServiceError = (error) => {
    console.error(error);
    return {
        success: false,
        httpStatus: error.httpStatus || 500,
        body: error.message || 'Something went wrong',
        code: error.code || 'INTERNAL_SERVER_ERROR',
        details: error.details || {}
    };
};

module.exports = toServiceError;
