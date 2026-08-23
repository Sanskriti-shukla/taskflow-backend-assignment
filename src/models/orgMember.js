const { DataTypes } = require('sequelize');
const db = require('../config/db.config');
const Role = require('../enums/role');

const OrgMember = db.define('org_members', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    },
    role: {
        type: DataTypes.ENUM(Role.ORG_ADMIN, Role.MEMBER),
        allowNull: false,
        defaultValue: Role.MEMBER
    }
}, {
    tableName: 'org_members',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

module.exports = OrgMember;
