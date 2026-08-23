const express = require('express');
const { z } = require('zod');
const router = express.Router();
const Controller = require('../controller/authController');
const { jwtVerify } = require('../middleware/JWT');
const { validateBody } = require('../middleware/validate');
const authRateLimiter = require('../middleware/rateLimiter');

const registerSchema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    organizationName: z.string().min(2).max(160),
    organizationSlug: z.string().regex(/^[a-z0-9-]{2,100}$/)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    organizationSlug: z.string().min(2).max(100)
});

const refreshSchema = z.object({
    refreshToken: z.string().min(20)
});

router.post('/register', authRateLimiter, validateBody(registerSchema), Controller.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), Controller.login);
router.post('/refresh', authRateLimiter, validateBody(refreshSchema), Controller.refresh);
router.post('/logout', authRateLimiter, validateBody(refreshSchema), Controller.logout);
router.post('/logout-all', jwtVerify, Controller.logoutAll);

module.exports = router;
