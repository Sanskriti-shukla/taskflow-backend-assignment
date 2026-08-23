const { fn, col } = require('sequelize');
const Project = require('../models/project');
const Task = require('../models/task');

const createProject = async (data) => {
    return await Project.create(data);
};

const getProjectById = async (projectId, organizationId) => {
    return await Project.findOne({
        where: {
            id: projectId,
            organizationId
        }
    });
};

const getAllProjects = async (organizationId, offset, limit) => {
    return await Project.findAndCountAll({
        where: { organizationId },
        order: [['createdAt', 'DESC']],
        offset,
        limit
    });
};

const updateProject = async (project, data) => {
    Object.assign(project, data);
    return await project.save();
};

const deleteProject = async (project) => {
    return await project.destroy();
};

const getProjectTaskCounts = async (projectId) => {
    return await Task.findAll({
        where: { projectId },
        attributes: [
            'status',
            [fn('COUNT', col('id')), 'count']
        ],
        group: ['status'],
        raw: true
    });
};

module.exports = {
    createProject,
    getProjectById,
    getAllProjects,
    updateProject,
    deleteProject,
    getProjectTaskCounts
};
