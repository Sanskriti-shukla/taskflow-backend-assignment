const bcrypt = require('bcrypt');
const db = require('../config/db.config');
const {
    User,
    Organization,
    OrgMember,
    Project,
    Task,
    TaskAssignment,
    Comment
} = require('../models');
const Role = require('../enums/role');
const TaskStatus = require('../enums/taskStatus');
const TaskPriority = require('../enums/taskPriority');

const PASSWORD = 'Password123!';

const ensureOrganization = async (name, slug) => {
    const [organization] = await Organization.findOrCreate({
        where: { slug },
        defaults: { name, slug }
    });
    return organization;
};

const ensureUser = async (name, email, passwordHash) => {
    const [user] = await User.findOrCreate({
        where: { email },
        defaults: { name, email, passwordHash }
    });
    return user;
};

const ensureMembership = async (organizationId, userId, role) => {
    const [membership] = await OrgMember.findOrCreate({
        where: { organizationId, userId },
        defaults: { organizationId, userId, role }
    });
    return membership;
};

const seedData = async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, Math.max(Number(process.env.BCRYPT_COST || 12), 12));

    const acme = await ensureOrganization('Acme Product Lab', 'acme');
    const globex = await ensureOrganization('Globex Delivery', 'globex');

    const alice = await ensureUser('Alice Admin', 'alice@taskflow.test', passwordHash);
    const bob = await ensureUser('Bob Builder', 'bob@taskflow.test', passwordHash);
    const carol = await ensureUser('Carol QA', 'carol@taskflow.test', passwordHash);
    const dave = await ensureUser('Dave Admin', 'dave@taskflow.test', passwordHash);
    const eve = await ensureUser('Eve Engineer', 'eve@taskflow.test', passwordHash);

    await ensureMembership(acme.id, alice.id, Role.ORG_ADMIN);
    await ensureMembership(acme.id, bob.id, Role.MEMBER);
    await ensureMembership(acme.id, carol.id, Role.MEMBER);
    await ensureMembership(globex.id, dave.id, Role.ORG_ADMIN);
    await ensureMembership(globex.id, eve.id, Role.MEMBER);

    if (await Project.count({ paranoid: false }) > 0) {
        return;
    }

    const apiProject = await Project.create({
        organizationId: acme.id,
        name: 'TaskFlow API',
        description: 'Core backend APIs and authentication.'
    });

    const mobileProject = await Project.create({
        organizationId: acme.id,
        name: 'Mobile Launch',
        description: 'Backend support for mobile application launch.'
    });

    const opsProject = await Project.create({
        organizationId: globex.id,
        name: 'Operations Automation',
        description: 'Internal delivery operations automation.'
    });

    const billingProject = await Project.create({
        organizationId: globex.id,
        name: 'Billing Refresh',
        description: 'Billing and invoice improvements.'
    });

    const taskDefinitions = [
        [apiProject.id, 'Design tenant schema', 'Normalize organization, project and task data.', TaskStatus.DONE, TaskPriority.HIGH, bob.id],
        [apiProject.id, 'Implement JWT authentication', 'Access token and refresh token flow.', TaskStatus.REVIEW, TaskPriority.URGENT, alice.id],
        [apiProject.id, 'Add task filters', 'Support status, priority, assignee and due-date filters.', TaskStatus.IN_PROGRESS, TaskPriority.HIGH, bob.id],
        [apiProject.id, 'Queue assignment email', 'Send assignment email using BullMQ worker.', TaskStatus.TODO, TaskPriority.HIGH, carol.id],
        [mobileProject.id, 'Project dashboard', 'Return task counts grouped by status.', TaskStatus.TODO, TaskPriority.MEDIUM, bob.id],
        [mobileProject.id, 'Review error contract', 'Keep API errors consistent.', TaskStatus.REVIEW, TaskPriority.MEDIUM, carol.id],
        [mobileProject.id, 'Prepare OpenAPI docs', 'Add Swagger UI and examples.', TaskStatus.IN_PROGRESS, TaskPriority.LOW, alice.id],
        [opsProject.id, 'Map dispatch workflow', 'Document current operations flow.', TaskStatus.DONE, TaskPriority.MEDIUM, eve.id],
        [opsProject.id, 'Create retry worker', 'Handle transient email failures.', TaskStatus.IN_PROGRESS, TaskPriority.URGENT, dave.id],
        [opsProject.id, 'Add audit notes', 'Persist useful delivery notes.', TaskStatus.TODO, TaskPriority.HIGH, eve.id],
        [billingProject.id, 'Invoice reconciliation', 'Compare generated invoice totals.', TaskStatus.REVIEW, TaskPriority.HIGH, dave.id],
        [billingProject.id, 'Billing pagination', 'Paginate invoice history.', TaskStatus.TODO, TaskPriority.LOW, eve.id]
    ];

    for (let i = 0; i < taskDefinitions.length; i++) {
        const [projectId, title, description, status, priority, assigneeId] = taskDefinitions[i];
        const task = await Task.create({
            projectId,
            title,
            description,
            status,
            priority,
            dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000)
        });

        await TaskAssignment.create({ taskId: task.id, userId: assigneeId });

        if (i % 2 === 0) {
            await Comment.create({
                taskId: task.id,
                authorId: assigneeId,
                body: `Seed comment for ${title}`
            });
        }
    }
};

const main = async () => {
    await db.authenticate();
    await seedData();
    console.log('Seed complete.');
    console.log('Demo password for all seed users: Password123!');
    console.log('Acme admin: alice@taskflow.test / org slug: acme');
    console.log('Globex admin: dave@taskflow.test / org slug: globex');
    await db.close();
};

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    seedData,
    PASSWORD
};
