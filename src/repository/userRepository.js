const User = require('../models/user');

const findUserByEmail = async (email, options = {}) => {
    return await User.findOne({ where: { email }, ...options });
};

const findUserById = async (userId, options = {}) => {
    return await User.findByPk(userId, options);
};

const createUser = async (data, options = {}) => {
    return await User.create(data, options);
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser
};
