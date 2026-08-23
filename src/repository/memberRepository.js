const OrgMember = require('../models/orgMember');
const User = require('../models/user');

const findMembership = async (organizationId, userId, options = {}) => {
    return await OrgMember.findOne({
        where: { organizationId, userId },
        ...options
    });
};

const createMembership = async (data, options = {}) => {
    return await OrgMember.create(data, options);
};

const getAllMembers = async (organizationId) => {
    return await OrgMember.findAll({
        where: { organizationId },
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
        }],
        order: [['createdAt', 'ASC']]
    });
};

const updateMembershipRole = async (membership, role) => {
    membership.role = role;
    return await membership.save();
};

const deleteMembership = async (membership) => {
    return await membership.destroy();
};

module.exports = {
    findMembership,
    createMembership,
    getAllMembers,
    updateMembershipRole,
    deleteMembership
};
