const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const TaskAssignment = db.define('task_assignments', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'task_id'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'task_assignments',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

module.exports = TaskAssignment;
