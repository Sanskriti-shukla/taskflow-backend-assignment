const IORedis = require('ioredis');
require('dotenv').config();

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null
};

if (process.env.REDIS_PASSWORD) {
    redisOptions.password = process.env.REDIS_PASSWORD;
}

const redisConnection = new IORedis(redisOptions);

module.exports = redisConnection;
