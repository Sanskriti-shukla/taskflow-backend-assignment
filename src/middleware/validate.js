const sendValidationError = (res, error) => {
    return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
            issues: error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        }
    });
};

const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return sendValidationError(res, result.error);
    req.body = result.data;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return sendValidationError(res, result.error);
    req.query = result.data;
    next();
};

const validateParams = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return sendValidationError(res, result.error);
    req.params = result.data;
    next();
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams
};
