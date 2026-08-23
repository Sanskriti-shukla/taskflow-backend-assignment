const jsonWebToken = require('jsonwebtoken');
const { findMembership } = require('../repository/memberRepository');

const jwtVerify = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized token',
                code: 'UNAUTHORIZED',
                details: {}
            });
        }

        const decoded = jsonWebToken.verify(token, process.env.SECRET_KEY);
        if (decoded.type !== 'access') {
            return res.status(401).json({
                error: 'Unauthorized token',
                code: 'UNAUTHORIZED',
                details: {}
            });
        }

        // Organization context comes from the signed token and is verified against DB membership.
        // We never trust an org_id sent by the client in request body/query params.
        const membership = await findMembership(decoded.organizationId, decoded.sub);
        if (!membership) {
            return res.status(403).json({
                error: 'Forbidden',
                code: 'FORBIDDEN',
                details: {}
            });
        }

        req.user = {
            data: {
                id: decoded.sub,
                organizationId: decoded.organizationId,
                role: membership.role
            }
        };

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Unauthorized token',
            code: 'UNAUTHORIZED',
            details: {}
        });
    }
};

module.exports = {
    jwtVerify
};
