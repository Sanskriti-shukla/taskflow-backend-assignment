const { rateLimit } = require('express-rate-limit');

const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
        return res.status(429).json({
            error: 'Too many authentication requests',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {}
        });
    }
});

module.exports = authRateLimiter;
