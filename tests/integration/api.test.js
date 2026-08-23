const request = require('supertest');
const app = require('../../app');
const db = require('../../src/config/db.config');
const { Project, OrgMember, User } = require('../../src/models');
const { resetDatabase } = require('../helpers/resetDatabase');
const { emailQueue, deadLetterQueue, redisConnection } = require('../../src/queue/emailQueue');

describe('TaskFlow API integration', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    afterAll(async () => {
        await emailQueue.close();
        await deadLetterQueue.close();
        await redisConnection.quit();
        await db.close();
    });

    const loginAsAlice = async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'alice@taskflow.test',
                password: 'Password123!',
                organizationSlug: 'acme'
            });

        expect(response.status).toBe(200);
        return response.body.tokens.accessToken;
    };

    test('login flow returns access and refresh tokens', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'alice@taskflow.test',
                password: 'Password123!',
                organizationSlug: 'acme'
            });

        expect(response.status).toBe(200);
        expect(response.body.tokens.accessToken).toBeTruthy();
        expect(response.body.tokens.refreshToken).toBeTruthy();
    });

    test('task CRUD works inside the authenticated organization', async () => {
        const token = await loginAsAlice();
        const projects = await request(app)
            .get('/projects')
            .set('Authorization', `Bearer ${token}`);

        const projectId = projects.body.data[0].id;

        const created = await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectId,
                title: 'Integration test task',
                status: 'todo',
                priority: 'high'
            });

        expect(created.status).toBe(201);
        const taskId = created.body.id;

        const fetched = await request(app)
            .get(`/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.title).toBe('Integration test task');

        const updated = await request(app)
            .put(`/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'in_progress' });
        expect(updated.status).toBe(200);
        expect(updated.body.status).toBe('in_progress');

        const deleted = await request(app)
            .delete(`/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(deleted.status).toBe(200);
    });

    test('cross-tenant project access returns 403 without resource data', async () => {
        const token = await loginAsAlice();
        const globexProject = await Project.findOne({
            include: [{
                association: 'organization',
                where: { slug: 'globex' }
            }]
        });

        const response = await request(app)
            .get(`/projects/${globexProject.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden',
            code: 'FORBIDDEN',
            details: {}
        });
        expect(JSON.stringify(response.body)).not.toContain(globexProject.name);
    });

    test('validation errors use the required error contract', async () => {
        const token = await loginAsAlice();
        const projects = await request(app)
            .get('/projects')
            .set('Authorization', `Bearer ${token}`);

        const response = await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectId: projects.body.data[0].id,
                title: '',
                priority: 'impossible-priority'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.code).toBe('VALIDATION_ERROR');
        expect(response.body.details).toBeDefined();
    });

    test('task assignment creates a BullMQ notification job', async () => {
        const token = await loginAsAlice();
        const projects = await request(app)
            .get('/projects')
            .set('Authorization', `Bearer ${token}`);

        const createdTask = await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectId: projects.body.data[0].id,
                title: 'Queue integration test',
                status: 'todo',
                priority: 'medium'
            });

        const bob = await User.findOne({ where: { email: 'bob@taskflow.test' } });
        const aliceOrg = await OrgMember.findOne({
            where: { userId: bob.id },
            attributes: ['organizationId']
        });
        expect(aliceOrg).toBeTruthy();

        const assignment = await request(app)
            .post(`/tasks/${createdTask.body.id}/assignments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: bob.id });

        expect(assignment.status).toBe(201);
        const jobId = assignment.body.notification.jobId;
        const job = await emailQueue.getJob(jobId);
        expect(job).toBeTruthy();
        expect(job.data.taskId).toBe(createdTask.body.id);
    });
});
