const { QueryTypes } = require('sequelize');
const db = require('../config/db.config');
const initialMigration = require('./001-create-taskflow');

const migrations = [initialMigration];
const META_TABLE = 'taskflow_migrations';

const ensureMetaTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS ${META_TABLE} (
            name varchar(255) PRIMARY KEY,
            executed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const runMigrations = async () => {
    await db.authenticate();
    await ensureMetaTable();

    const rows = await db.query(`SELECT name FROM ${META_TABLE}`, { type: QueryTypes.SELECT });
    const applied = new Set(rows.map((row) => row.name));
    let count = 0;

    for (const migration of migrations) {
        if (applied.has(migration.name)) continue;

        await db.transaction(async (transaction) => {
            // Migration commands run on the same Sequelize instance. DDL is transactional in PostgreSQL.
            await migration.up(db, transaction);
            await db.query(`INSERT INTO ${META_TABLE} (name) VALUES (:name)`, {
                replacements: { name: migration.name },
                transaction
            });
        });
        count++;
    }

    return count;
};

const revertLastMigration = async () => {
    await db.authenticate();
    await ensureMetaTable();

    const rows = await db.query(
        `SELECT name FROM ${META_TABLE} ORDER BY executed_at DESC LIMIT 1`,
        { type: QueryTypes.SELECT }
    );

    if (!rows.length) return null;

    const migration = [...migrations].reverse().find((item) => item.name === rows[0].name);
    if (!migration) throw new Error(`Migration file not found for ${rows[0].name}`);

    await db.transaction(async (transaction) => {
        await migration.down(db, transaction);
        await db.query(`DELETE FROM ${META_TABLE} WHERE name = :name`, {
            replacements: { name: migration.name },
            transaction
        });
    });

    return migration.name;
};

const main = async () => {
    const command = process.argv[2] || 'up';

    if (command === 'up') {
        const count = await runMigrations();
        console.log(`Applied ${count} migration(s).`);
    } else if (command === 'down') {
        const name = await revertLastMigration();
        console.log(name ? `Reverted migration: ${name}` : 'No migration to revert.');
    } else {
        throw new Error('Use: node src/migrations/index.js up|down');
    }

    await db.close();
};

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    runMigrations,
    revertLastMigration
};
