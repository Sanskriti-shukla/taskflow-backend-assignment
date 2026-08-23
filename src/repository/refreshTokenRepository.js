const RefreshToken = require('../models/refreshToken');

const createRefreshToken = async (data, options = {}) => {
    return await RefreshToken.create(data, options);
};

const findRefreshTokenById = async (tokenId) => {
    return await RefreshToken.findByPk(tokenId);
};

const findRefreshTokenByHash = async (tokenHash) => {
    return await RefreshToken.findOne({ where: { tokenHash } });
};

const revokeRefreshToken = async (refreshToken) => {
    refreshToken.revokedAt = new Date();
    return await refreshToken.save();
};

const revokeAllRefreshTokens = async (userId, organizationId) => {
    return await RefreshToken.update(
        { revokedAt: new Date() },
        {
            where: {
                userId,
                organizationId,
                revokedAt: null
            }
        }
    );
};

module.exports = {
    createRefreshToken,
    findRefreshTokenById,
    findRefreshTokenByHash,
    revokeRefreshToken,
    revokeAllRefreshTokens
};
