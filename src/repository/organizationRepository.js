const Organization = require('../models/organization');

const findOrganizationBySlug = async (slug, options = {}) => {
    return await Organization.findOne({ where: { slug }, ...options });
};

const findOrganizationById = async (organizationId, options = {}) => {
    return await Organization.findByPk(organizationId, options);
};

const createOrganization = async (data, options = {}) => {
    return await Organization.create(data, options);
};

module.exports = {
    findOrganizationBySlug,
    findOrganizationById,
    createOrganization
};
