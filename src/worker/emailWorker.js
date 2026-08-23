const { Worker } = require('bullmq');
const {
    redisConnection,
    deadLetterQueue
} = require('../queue/emailQueue');

const mockSendEmail = async (data) => {
    // Mock email provider is acceptable for this assignment.
    // Use an address ending in @fail.test to demonstrate retries and DLQ behavior.
    if (data.userEmail.endsWith('@fail.test')) {
        throw new Error('Mock email provider failure');
    }

    console.log(
        `[TaskFlow Email] To: ${data.userEmail} | ` +
        `${data.userName}, you were assigned to "${data.taskTitle}" in ${data.projectName}`
    );
};

const startEmailWorker = () => {
    const worker = new Worker(
        'task-email',
        async (job) => {
            await mockSendEmail(job.data);
            return { sent: true, sentAt: new Date().toISOString() };
        },
        {
            connection: redisConnection,
            concurrency: 5,
            // Bonus requirement: global email processing limit of 50 emails/minute.
            limiter: {
                max: 50,
                duration: 60 * 1000
            }
        }
    );

    worker.on('completed', (job) => {
        console.log(`Email job ${job.id} completed.`);
    });

    worker.on('failed', async (job, error) => {
        if (!job) return;

        const maxAttempts = Number(job.opts.attempts || 1);
        if (job.attemptsMade < maxAttempts) {
            console.log(`Email job ${job.id} failed. Retrying...`);
            return;
        }

        await deadLetterQueue.add(
            'task-assigned-dead',
            {
                ...job.data,
                attemptsMade: job.attemptsMade,
                failedReason: error.message
            },
            {
                jobId: String(job.id),
                removeOnComplete: false,
                removeOnFail: false
            }
        );

        try {
            await job.remove();
        } catch (removeError) {
            console.error(`Unable to remove failed job ${job.id}:`, removeError.message);
        }

        console.error(`Email job ${job.id} moved to dead-letter queue.`);
    });

    console.log('TaskFlow email worker started.');
    return worker;
};

module.exports = {
    startEmailWorker,
    mockSendEmail
};
