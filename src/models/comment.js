const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const Comment = db.define('comments', {
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
    authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'author_id'
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'comments',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

module.exports = Comment;
