const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const db = require('./src/config/db.config');
require('./src/models/index');
const routes = require('./src/routes/index');
const swaggerDocs = require('./src/utils/swagger');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

app.get('/health', async (req, res) => {
    try {
        await db.authenticate();
        return res.json({ status: 'ok' });
    } catch (error) {
        return res.status(503).json({
            error: 'Database unavailable',
            code: 'DATABASE_UNAVAILABLE',
            details: {}
        });
    }
});

// Assignment endpoints are intentionally exposed without an /api prefix.
app.use('/', routes);
swaggerDocs(app);

app.use((req, res) => {
    return res.status(404).json({
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        details: {}
    });
});

app.use((error, req, res, next) => {
    console.error(error);
    return res.status(500).json({
        error: 'Something went wrong',
        code: 'INTERNAL_SERVER_ERROR',
        details: {}
    });
});

if (require.main === module) {
    db.authenticate()
        .then(() => {
            app.listen(process.env.PORT || 3000, () => {
                console.log(`TaskFlow API is running on port ${process.env.PORT || 3000}`);
                console.log(`Swagger: http://localhost:${process.env.PORT || 3000}/docs`);
            });
        })
        .catch((error) => {
            console.error('Unable to connect to PostgreSQL:', error);
            process.exit(1);
        });
}

module.exports = app;
