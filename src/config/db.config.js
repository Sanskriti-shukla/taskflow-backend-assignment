const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const parseBoolean = (value) => String(value).toLowerCase() === 'true';

const databaseName = process.env.NODE_ENV === 'test'
    ? (process.env.DB_TEST_NAME || 'taskflow_test')
    : (process.env.DB_NAME || 'taskflow');

const db = new Sequelize(
    databaseName,
    process.env.DB_USERNAME || 'taskflow',
    process.env.DB_PASSWORD || 'taskflow',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: parseBoolean(process.env.DB_LOGGING || 'false') ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = db;
