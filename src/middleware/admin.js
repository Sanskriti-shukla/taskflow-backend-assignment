const Role = require('../enums/role');

const requireOrgAdmin = (req, res, next) => {
    if (req.user?.data?.role !== Role.ORG_ADMIN) {
        return res.status(403).json({
            error: 'Forbidden',
            code: 'FORBIDDEN',
            details: {}
        });
    }

    next();
};

module.exports = {
    requireOrgAdmin
};
