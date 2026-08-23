const db = require('../../src/config/db.config');
require('../../src/models');
const { runMigrations } = require('../../src/migrations');
const { seedData } = require('../../src/seed/seed');
const { emailQueue, deadLetterQueue } = require('../../src/queue/emailQueue');

const resetDatabase = async () => {
    await db.authenticate();
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await runMigrations();
    await seedData();

    await emailQueue.obliterate({ force: true }).catch(() => {});
    await deadLetterQueue.obliterate({ force: true }).catch(() => {});
};

module.exports = {
    resetDatabase
};
