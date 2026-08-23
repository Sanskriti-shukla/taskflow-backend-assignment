const { QueryTypes } = require('sequelize');
const db = require('../config/db.config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
    for (let attempt = 1; attempt <= 60; attempt++) {
        try {
            await db.authenticate();
            const rows = await db.query(
                "SELECT to_regclass('public.tasks') AS table_name",
                { type: QueryTypes.SELECT }
            );

            if (rows[0]?.table_name) {
                console.log('Database schema is ready.');
                await db.close();
                return;
            }
        } catch (error) {
            // API may still be starting migrations.
        }

        console.log(`Waiting for API migrations (${attempt}/60)...`);
        await sleep(1000);
    }

    throw new Error('Database schema was not ready in time.');
};

main().catch(async (error) => {
    console.error(error);
    try { await db.close(); } catch (_) { }
    process.exit(1);
});
