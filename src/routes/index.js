const express = require('express');
const router = express.Router();

const authRoute = require('./auth');
const memberRoute = require('./members');
const projectRoute = require('./projects');
const taskRoute = require('./tasks');
const jobRoute = require('./jobs');

router.use('/auth', authRoute);
router.use('/members', memberRoute);
router.use('/projects', projectRoute);
router.use('/tasks', taskRoute);
router.use('/jobs', jobRoute);

module.exports = router;
