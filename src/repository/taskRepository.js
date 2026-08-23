const { Op } = require('sequelize');
const db = require('../config/db.config');
const Task = require('../models/task');
const Project = require('../models/project');
const TaskAssignment = require('../models/taskAssignment');
const User = require('../models/user');

const createTask = async (data) => {
    return await Task.create(data);
};

const getTaskById = async (taskId, organizationId) => {
    return await Task.findOne({
        where: { id: taskId },
        include: [
            {
                model: Project,
                as: 'project',
                required: true,
                where: { organizationId },
                attributes: ['id', 'name', 'organizationId']
            },
            {
                model: TaskAssignment,
                as: 'assignments',
                required: false,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }]
            }
        ]
    });
};

const getAllTasks = async (organizationId, filters, offset, limit) => {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.projectId) where.projectId = filters.projectId;

    if (filters.dueFrom || filters.dueTo) {
        where.dueDate = {};
        if (filters.dueFrom) where.dueDate[Op.gte] = new Date(filters.dueFrom);
        if (filters.dueTo) where.dueDate[Op.lte] = new Date(filters.dueTo);
    }

    if (filters.search) {
        // db.escape keeps the PostgreSQL full-text query safe while using the GIN search_vector index.
        where[Op.and] = [
            db.literal(
                `"tasks"."search_vector" @@ plainto_tsquery('english', ${db.escape(filters.search)})`
            )
        ];
    }

    const assignmentInclude = {
        model: TaskAssignment,
        as: 'assignments',
        required: Boolean(filters.assigneeId),
        where: filters.assigneeId ? { userId: filters.assigneeId } : undefined,
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
        }]
    };

    return await Task.findAndCountAll({
        where,
        include: [
            {
                model: Project,
                as: 'project',
                required: true,
                where: { organizationId },
                attributes: ['id', 'name', 'organizationId']
            },
            assignmentInclude
        ],
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        distinct: true
    });
};

const updateTask = async (task, data) => {
    Object.assign(task, data);
    return await task.save();
};

const deleteTask = async (task) => {
    return await task.destroy();
};

const findAssignment = async (taskId, userId) => {
    return await TaskAssignment.findOne({ where: { taskId, userId } });
};

const createAssignment = async (taskId, userId) => {
    return await TaskAssignment.create({ taskId, userId });
};

const deleteAssignment = async (assignment) => {
    return await assignment.destroy();
};

const getAccessibleTaskIds = async (taskIds, organizationId) => {
    return await Task.findAll({
        where: { id: { [Op.in]: taskIds } },
        attributes: ['id'],
        include: [{
            model: Project,
            as: 'project',
            required: true,
            attributes: [],
            where: { organizationId }
        }]
    });
};

const bulkUpdateTaskStatus = async (taskIds, status) => {
    return await Task.update(
        { status },
        { where: { id: { [Op.in]: taskIds } } }
    );
};

module.exports = {
    createTask,
    getTaskById,
    getAllTasks,
    updateTask,
    deleteTask,
    findAssignment,
    createAssignment,
    deleteAssignment,
    getAccessibleTaskIds,
    bulkUpdateTaskStatus
};
