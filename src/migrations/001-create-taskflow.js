const { DataTypes, Sequelize } = require('sequelize');

const up = async (db, transaction) => {
    const queryInterface = db.getQueryInterface();
    const createTable = (name, columns) => queryInterface.createTable(name, columns, { transaction });
    const addConstraint = (table, options) => queryInterface.addConstraint(table, { ...options, transaction });
    const query = (sql) => db.query(sql, { transaction });

    await createTable('users', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        name: { type: DataTypes.STRING(120), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password_hash: { type: DataTypes.STRING(255), allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createTable('organizations', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        name: { type: DataTypes.STRING(160), allowNull: false },
        slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createTable('org_members', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        organization_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'organizations', key: 'id' },
            onDelete: 'CASCADE' // Membership has no meaning after an organization is deleted.
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE' // Remove memberships when a user is removed.
        },
        role: {
            type: DataTypes.ENUM('org_admin', 'member'),
            allowNull: false,
            defaultValue: 'member'
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await addConstraint('org_members', {
        fields: ['organization_id', 'user_id'],
        type: 'unique',
        name: 'uq_org_members_organization_user'
    });

    await createTable('projects', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        organization_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'organizations', key: 'id' },
            onDelete: 'RESTRICT' // Avoid accidentally hard-deleting an org that still owns project data.
        },
        name: { type: DataTypes.STRING(180), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await createTable('tasks', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'projects', key: 'id' },
            onDelete: 'CASCADE' // Tasks are children of projects; hard project cleanup removes child tasks.
        },
        title: { type: DataTypes.STRING(220), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
            allowNull: false,
            defaultValue: 'todo'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            allowNull: false,
            defaultValue: 'medium'
        },
        due_date: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await createTable('task_assignments', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        task_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'tasks', key: 'id' },
            onDelete: 'CASCADE' // Assignment disappears if its task is hard-deleted.
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'RESTRICT' // Keep history safe; user deletion is blocked while assigned.
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await addConstraint('task_assignments', {
        fields: ['task_id', 'user_id'],
        type: 'unique',
        name: 'uq_task_assignments_task_user'
    });

    await createTable('comments', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        task_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'tasks', key: 'id' },
            onDelete: 'CASCADE'
        },
        author_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'RESTRICT' // Preserve comment author integrity.
        },
        body: { type: DataTypes.TEXT, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createTable('refresh_tokens', {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },
        organization_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'organizations', key: 'id' },
            onDelete: 'CASCADE'
        },
        token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        revoked_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // PostgreSQL full-text search: generated vector combines task title + description.
    await query(`
        ALTER TABLE tasks
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
        ) STORED
    `);

    // Index decisions: these columns are used on authenticated/tenant-scoped listing and filtering paths.
    await query('CREATE INDEX idx_org_members_user_org ON org_members (user_id, organization_id)');
    await query('CREATE INDEX idx_projects_org_created ON projects (organization_id, created_at DESC) WHERE deleted_at IS NULL');
    await query('CREATE INDEX idx_tasks_project_status ON tasks (project_id, status) WHERE deleted_at IS NULL');
    await query('CREATE INDEX idx_tasks_project_priority ON tasks (project_id, priority) WHERE deleted_at IS NULL');
    await query('CREATE INDEX idx_tasks_due_date ON tasks (due_date) WHERE deleted_at IS NULL');
    await query('CREATE INDEX idx_task_assignments_user_task ON task_assignments (user_id, task_id)');
    await query('CREATE INDEX idx_comments_task_created ON comments (task_id, created_at)');
    await query('CREATE INDEX idx_refresh_tokens_user_org ON refresh_tokens (user_id, organization_id)');
    await query('CREATE INDEX idx_tasks_search_vector ON tasks USING GIN (search_vector)');
};

const down = async (db, transaction) => {
    const queryInterface = db.getQueryInterface();
    const dropTable = (name) => queryInterface.dropTable(name, { transaction });
    const query = (sql) => db.query(sql, { transaction });

    await dropTable('refresh_tokens');
    await dropTable('comments');
    await dropTable('task_assignments');
    await dropTable('tasks');
    await dropTable('projects');
    await dropTable('org_members');
    await dropTable('organizations');
    await dropTable('users');

    await query('DROP TYPE IF EXISTS "enum_tasks_priority"');
    await query('DROP TYPE IF EXISTS "enum_tasks_status"');
    await query('DROP TYPE IF EXISTS "enum_org_members_role"');
};

module.exports = {
    name: '001-create-taskflow',
    up,
    down
};
