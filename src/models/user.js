const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const User = db.define('users', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true
});

module.exports = User;
