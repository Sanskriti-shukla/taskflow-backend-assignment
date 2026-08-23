const AppError = require('./AppError');

const validateAssigneeMembership = (membership) => {
    if (!membership) {
        throw new AppError(
            400,
            'Assigned user must belong to the same organization as the task',
            'ASSIGNEE_NOT_IN_ORGANIZATION'
        );
    }
    return true;
};

module.exports = {
    validateAssigneeMembership
};
