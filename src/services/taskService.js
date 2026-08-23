const AppError = require('../common/AppError');
const toServiceError = require('../common/serviceError');
const { validateAssigneeMembership } = require('../common/assignmentHelper');
const { getPagination, getPaginationResponse } = require('../common/paginationHelper');
const { getProjectById } = require('../repository/projectRepository');
const { findMembership } = require('../repository/memberRepository');
const { findUserById } = require('../repository/userRepository');
const {
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
} = require('../repository/taskRepository');
const { enqueueAssignmentEmail } = require('../queue/emailQueue');

class TaskServices {
    async createTask(data, organizationId) {
        try {
            const project = await getProjectById(data.projectId, organizationId);
            if (!project) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            const task = await createTask({
                projectId: data.projectId,
                title: data.title,
                description: data.description || null,
                status: data.status,
                priority: data.priority,
                dueDate: data.dueDate ? new Date(data.dueDate) : null
            });

            return { success: true, body: task };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async getAllTasks(query, organizationId) {
        try {
            const { page, limit, offset } = getPagination(query.page, query.limit);
            const result = await getAllTasks(
                organizationId,
                {
                    status: query.status,
                    priority: query.priority,
                    assigneeId: query.assigneeId,
                    projectId: query.projectId,
                    dueFrom: query.dueFrom,
                    dueTo: query.dueTo,
                    search: query.search
                },
                offset,
                limit
            );

            return {
                success: true,
                body: getPaginationResponse(result.rows, result.count, page, limit)
            };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async getTaskById(taskId, organizationId) {
        try {
            const task = await getTaskById(taskId, organizationId);
            if (!task) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }
            return { success: true, body: task };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async updateTask(taskId, data, organizationId) {
        try {
            const task = await getTaskById(taskId, organizationId);
            if (!task) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            if (data.projectId && data.projectId !== task.projectId) {
                const project = await getProjectById(data.projectId, organizationId);
                if (!project) {
                    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
                }
            }

            const result = await updateTask(task, {
                ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {})
            });

            return { success: true, body: result };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async deleteTask(taskId, organizationId) {
        try {
            const task = await getTaskById(taskId, organizationId);
            if (!task) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            await deleteTask(task);
            return { success: true, body: { success: true } };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async assignTask(taskId, data, organizationId) {
        try {
            const task = await getTaskById(taskId, organizationId);
            if (!task) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            const membership = await findMembership(organizationId, data.userId);
            validateAssigneeMembership(membership);

            const user = await findUserById(data.userId);
            if (!user) {
                throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
            }

            const existingAssignment = await findAssignment(taskId, data.userId);
            if (existingAssignment) {
                throw new AppError(409, 'User is already assigned to this task', 'ASSIGNMENT_ALREADY_EXISTS');
            }

            // Consistency strategy: compensation.
            // 1) persist assignment, 2) enqueue job, 3) only then return success.
            // If Redis enqueue fails, delete the assignment before returning 503.
            const assignment = await createAssignment(taskId, data.userId);
            let job;

            try {
                job = await enqueueAssignmentEmail({
                    assignmentId: assignment.id,
                    taskId: task.id,
                    taskTitle: task.title,
                    projectName: task.project.name,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name,
                    organizationId
                });
            } catch (queueError) {
                await deleteAssignment(assignment);
                throw new AppError(
                    503,
                    'Unable to queue assignment notification. Assignment was rolled back.',
                    'QUEUE_ENQUEUE_FAILED'
                );
            }

            return {
                success: true,
                body: {
                    assignment,
                    notification: {
                        jobId: String(job.id),
                        status: 'pending'
                    }
                }
            };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async unassignTask(taskId, userId, organizationId) {
        try {
            const task = await getTaskById(taskId, organizationId);
            if (!task) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            const assignment = await findAssignment(taskId, userId);
            if (!assignment) {
                throw new AppError(404, 'Task assignment not found', 'ASSIGNMENT_NOT_FOUND');
            }

            await deleteAssignment(assignment);
            return { success: true, body: { success: true } };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async bulkUpdateStatus(data, organizationId) {
        try {
            const uniqueTaskIds = [...new Set(data.taskIds)];
            const accessibleTasks = await getAccessibleTaskIds(uniqueTaskIds, organizationId);

            if (accessibleTasks.length !== uniqueTaskIds.length) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            await bulkUpdateTaskStatus(uniqueTaskIds, data.status);
            return {
                success: true,
                body: {
                    updated: uniqueTaskIds.length,
                    status: data.status
                }
            };
        } catch (error) {
            return toServiceError(error);
        }
    }
}

module.exports = TaskServices;
