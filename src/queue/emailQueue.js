const { Queue } = require('bullmq');
const redisConnection = require('../config/redis.config');

const emailQueue = new Queue('task-email', { connection: redisConnection });
const deadLetterQueue = new Queue('task-email-dlq', { connection: redisConnection });

const enqueueAssignmentEmail = async (payload) => {
    return await emailQueue.add('task-assigned', payload, {
        jobId: payload.assignmentId,
        // BullMQ attempts includes the first execution. 4 total = initial attempt + 3 retries.
        // Exponential delay 1000ms gives retry waits of 1s, 2s and 4s.
        attempts: 4,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: false,
        removeOnFail: false
    });
};

module.exports = {
    emailQueue,
    deadLetterQueue,
    redisConnection,
    enqueueAssignmentEmail
};
