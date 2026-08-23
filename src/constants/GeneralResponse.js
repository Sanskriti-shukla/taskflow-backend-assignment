const GeneralResponse = (res, result, status) => {
    if (status.code >= 400) {
        return res.status(status.code).json({
            error: status.description,
            code: status.errorCode || 'INTERNAL_SERVER_ERROR',
            details: result || {}
        });
    }

    return res.status(status.code).json(result);
};

module.exports = GeneralResponse;
