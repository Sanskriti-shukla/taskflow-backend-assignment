const express = require('express');
const router = express.Router();
const Controller = require('../controller/jobController');
const { jwtVerify } = require('../middleware/JWT');

router.get('/:id', jwtVerify, Controller.getJobStatus);

module.exports = router;
