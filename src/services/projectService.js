const TaskStatus = require('../enums/taskStatus');
const AppError = require('../common/AppError');
const toServiceError = require('../common/serviceError');
const { getPagination, getPaginationResponse } = require('../common/paginationHelper');
const {
    createProject,
    getProjectById,
    getAllProjects,
    updateProject,
    deleteProject,
    getProjectTaskCounts
} = require('../repository/projectRepository');

class ProjectServices {
    async createProject(data, organizationId) {
        try {
            const project = await createProject({
                organizationId,
                name: data.name,
                description: data.description || null
            });
            return { success: true, body: project };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async getAllProjects(query, organizationId) {
        try {
            const { page, limit, offset } = getPagination(query.page, query.limit);
            const result = await getAllProjects(organizationId, offset, limit);
            return {
                success: true,
                body: getPaginationResponse(result.rows, result.count, page, limit)
            };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async getProjectById(projectId, organizationId) {
        try {
            const project = await getProjectById(projectId, organizationId);
            if (!project) {
                // A tenant-scoped miss is returned as 403 so cross-tenant IDs never reveal resource data.
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }
            return { success: true, body: project };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async updateProject(projectId, data, organizationId) {
        try {
            const project = await getProjectById(projectId, organizationId);
            if (!project) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            const result = await updateProject(project, {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.description !== undefined ? { description: data.description } : {})
            });
            return { success: true, body: result };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async deleteProject(projectId, organizationId) {
        try {
            const project = await getProjectById(projectId, organizationId);
            if (!project) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            await deleteProject(project);
            return { success: true, body: { success: true } };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async getDashboard(projectId, organizationId) {
        try {
            const project = await getProjectById(projectId, organizationId);
            if (!project) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            const rows = await getProjectTaskCounts(projectId);
            const counts = {
                [TaskStatus.TODO]: 0,
                [TaskStatus.IN_PROGRESS]: 0,
                [TaskStatus.REVIEW]: 0,
                [TaskStatus.DONE]: 0
            };

            rows.forEach((row) => {
                counts[row.status] = Number(row.count);
            });

            return {
                success: true,
                body: {
                    projectId,
                    counts
                }
            };
        } catch (error) {
            return toServiceError(error);
        }
    }
}

module.exports = ProjectServices;
