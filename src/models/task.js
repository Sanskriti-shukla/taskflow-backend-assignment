const { DataTypes } = require('sequelize');
const db = require('../config/db.config');
const TaskStatus = require('../enums/taskStatus');
const TaskPriority = require('../enums/taskPriority');

const Task = db.define('tasks', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'project_id'
    },
    title: {
        type: DataTypes.STRING(220),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(
            TaskStatus.TODO,
            TaskStatus.IN_PROGRESS,
            TaskStatus.REVIEW,
            TaskStatus.DONE
        ),
        allowNull: false,
        defaultValue: TaskStatus.TODO
    },
    priority: {
        type: DataTypes.ENUM(
            TaskPriority.LOW,
            TaskPriority.MEDIUM,
            TaskPriority.HIGH,
            TaskPriority.URGENT
        ),
        allowNull: false,
        defaultValue: TaskPriority.MEDIUM
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'due_date'
    }
}, {
    tableName: 'tasks',
    timestamps: true,
    paranoid: true,
    underscored: true,
    deletedAt: 'deleted_at'
});

module.exports = Task;
