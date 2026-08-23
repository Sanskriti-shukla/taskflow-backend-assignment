const express = require('express');
const { z } = require('zod');
const router = express.Router();
const Controller = require('../controller/memberController');
const { jwtVerify } = require('../middleware/JWT');
const { requireOrgAdmin } = require('../middleware/admin');
const { validateBody, validateParams } = require('../middleware/validate');
const Role = require('../enums/role');

const addMemberSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email(),
    password: z.string().min(8).max(100).optional(),
    role: z.enum([Role.ORG_ADMIN, Role.MEMBER]).default(Role.MEMBER)
});

const userParamSchema = z.object({ userId: z.string().uuid() });

const updateRoleSchema = z.object({
    role: z.enum([Role.ORG_ADMIN, Role.MEMBER])
});

router.get('/', jwtVerify, Controller.getAllMembers);
router.post('/', jwtVerify, requireOrgAdmin, validateBody(addMemberSchema), Controller.addMember);
router.patch('/:userId', jwtVerify, requireOrgAdmin, validateParams(userParamSchema), validateBody(updateRoleSchema), Controller.updateMemberRole);
router.delete('/:userId', jwtVerify, requireOrgAdmin, validateParams(userParamSchema), Controller.deleteMember);

module.exports = router;
