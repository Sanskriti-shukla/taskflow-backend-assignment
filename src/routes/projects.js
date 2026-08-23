const express = require('express');
const { z } = require('zod');
const router = express.Router();
const Controller = require('../controller/projectController');
const { jwtVerify } = require('../middleware/JWT');
const { requireOrgAdmin } = require('../middleware/admin');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');

const createProjectSchema = z.object({
    name: z.string().min(2).max(180),
    description: z.string().max(5000).nullable().optional()
});

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
});

const idParamSchema = z.object({ id: z.string().uuid() });

const updateProjectSchema = createProjectSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one field is required' }
);

router.post('/', jwtVerify, validateBody(createProjectSchema), Controller.createProject);
router.get('/', jwtVerify, validateQuery(paginationSchema), Controller.getAllProjects);
router.get('/:id/dashboard', jwtVerify, validateParams(idParamSchema), Controller.getDashboard);
router.get('/:id', jwtVerify, validateParams(idParamSchema), Controller.getProjectById);
router.put('/:id', jwtVerify, validateParams(idParamSchema), validateBody(updateProjectSchema), Controller.updateProject);
router.delete('/:id', jwtVerify, requireOrgAdmin, validateParams(idParamSchema), Controller.deleteProject);

module.exports = router;
