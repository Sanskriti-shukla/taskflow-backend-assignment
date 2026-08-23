const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const Project = db.define('projects', {
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
    name: {
        type: DataTypes.STRING(180),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'projects',
    timestamps: true,
    paranoid: true,
    underscored: true,
    deletedAt: 'deleted_at'
});

module.exports = Project;
