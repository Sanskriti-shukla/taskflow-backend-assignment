require('dotenv').config();
const { startEmailWorker } = require('./src/worker/emailWorker');

startEmailWorker();
