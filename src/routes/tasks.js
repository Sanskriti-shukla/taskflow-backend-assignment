const express = require('express');
const { z } = require('zod');
const router = express.Router();
const Controller = require('../controller/taskController');
const { jwtVerify } = require('../middleware/JWT');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const TaskStatus = require('../enums/taskStatus');
const TaskPriority = require('../enums/taskPriority');

const statusValues = Object.values(TaskStatus);
const priorityValues = Object.values(TaskPriority);

const createTaskSchema = z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1).max(220),
    description: z.string().max(10000).nullable().optional(),
    status: z.enum(statusValues).default(TaskStatus.TODO),
    priority: z.enum(priorityValues).default(TaskPriority.MEDIUM),
    dueDate: z.string().datetime().nullable().optional()
});

const updateTaskSchema = z.object({
    projectId: z.string().uuid().optional(),
    title: z.string().min(1).max(220).optional(),
    description: z.string().max(10000).nullable().optional(),
    status: z.enum(statusValues).optional(),
    priority: z.enum(priorityValues).optional(),
    dueDate: z.string().datetime().nullable().optional()
}).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
});

const taskQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(statusValues).optional(),
    priority: z.enum(priorityValues).optional(),
    assigneeId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    dueFrom: z.string().datetime().optional(),
    dueTo: z.string().datetime().optional(),
    search: z.string().min(1).max(200).optional()
});

const idParamSchema = z.object({ id: z.string().uuid() });
const assignmentParamSchema = z.object({ id: z.string().uuid(), userId: z.string().uuid() });

const assignmentSchema = z.object({
    userId: z.string().uuid()
});

const bulkStatusSchema = z.object({
    taskIds: z.array(z.string().uuid()).min(1).max(100),
    status: z.enum(statusValues)
});

router.post('/', jwtVerify, validateBody(createTaskSchema), Controller.createTask);
router.get('/', jwtVerify, validateQuery(taskQuerySchema), Controller.getAllTasks);
router.patch('/bulk/status', jwtVerify, validateBody(bulkStatusSchema), Controller.bulkUpdateStatus);
router.get('/:id', jwtVerify, validateParams(idParamSchema), Controller.getTaskById);
router.put('/:id', jwtVerify, validateParams(idParamSchema), validateBody(updateTaskSchema), Controller.updateTask);
router.delete('/:id', jwtVerify, validateParams(idParamSchema), Controller.deleteTask);
router.post('/:id/assignments', jwtVerify, validateParams(idParamSchema), validateBody(assignmentSchema), Controller.assignTask);
router.delete('/:id/assignments/:userId', jwtVerify, validateParams(assignmentParamSchema), Controller.unassignTask);

module.exports = router;
