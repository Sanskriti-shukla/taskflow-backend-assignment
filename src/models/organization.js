const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const Organization = db.define('organizations', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(160),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'organizations',
    timestamps: true,
    underscored: true
});

module.exports = Organization;
