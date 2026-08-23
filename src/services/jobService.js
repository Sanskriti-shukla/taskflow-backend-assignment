const AppError = require('../common/AppError');
const toServiceError = require('../common/serviceError');
const { emailQueue, deadLetterQueue } = require('../queue/emailQueue');

const normalizeState = (state) => {
    if (['waiting', 'delayed', 'waiting-children', 'prioritized'].includes(state)) return 'pending';
    if (state === 'active') return 'active';
    if (state === 'completed') return 'completed';
    return 'failed';
};

class JobServices {
    async getJobStatus(jobId, organizationId) {
        try {
            const job = await emailQueue.getJob(jobId);

            if (job) {
                if (job.data.organizationId !== organizationId) {
                    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
                }

                const state = await job.getState();
                return {
                    success: true,
                    body: {
                        id: String(job.id),
                        status: normalizeState(state),
                        metadata: {
                            name: job.name,
                            taskId: job.data.taskId,
                            assignmentId: job.data.assignmentId,
                            attemptsMade: job.attemptsMade,
                            failedReason: job.failedReason || null
                        }
                    }
                };
            }

            const deadJob = await deadLetterQueue.getJob(jobId);
            if (deadJob) {
                if (deadJob.data.organizationId !== organizationId) {
                    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
                }

                return {
                    success: true,
                    body: {
                        id: String(deadJob.id),
                        status: 'failed',
                        metadata: {
                            name: deadJob.name,
                            taskId: deadJob.data.taskId,
                            assignmentId: deadJob.data.assignmentId,
                            attemptsMade: deadJob.data.attemptsMade,
                            failedReason: deadJob.data.failedReason || null
                        }
                    }
                };
            }

            throw new AppError(404, 'Job not found', 'JOB_NOT_FOUND');
        } catch (error) {
            return toServiceError(error);
        }
    }
}

module.exports = JobServices;
