const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const RefreshToken = db.define('refresh_tokens', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id'
    },
    tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'token_hash'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at'
    },
    revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at'
    }
}, {
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

module.exports = RefreshToken;
