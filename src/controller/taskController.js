const TaskServices = require('../services/taskService');
const taskServiceInterface = new TaskServices();
const methods = {};
const Response = require('../constants/Response');
const GeneralResponse = require('../constants/GeneralResponse');
const MessageConstants = require('../constants/MessageConstant');

const sendResult = (res, result, successResponse) => {
    if (!result.success) {
        return GeneralResponse(res, result.details, Response.getErrorResponse(result.httpStatus, result.body, result.code));
    }
    return GeneralResponse(res, result.body, successResponse);
};

methods.createTask = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.createTask(req.body, organizationId);
    return sendResult(res, result, Response.getCreatedResponse(MessageConstants.TASK_CREATED));
};

methods.getAllTasks = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.getAllTasks(req.query, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.SUCCESS));
};

methods.getTaskById = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.getTaskById(req.params.id, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.SUCCESS));
};

methods.updateTask = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.updateTask(req.params.id, req.body, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.TASK_UPDATED));
};

methods.deleteTask = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.deleteTask(req.params.id, organizationId);
    return sendResult(res, result, Response.getDeletedResponse(MessageConstants.TASK_DELETED));
};

methods.assignTask = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.assignTask(req.params.id, req.body, organizationId);
    return sendResult(res, result, Response.getCreatedResponse(MessageConstants.ASSIGNMENT_CREATED));
};

methods.unassignTask = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.unassignTask(
        req.params.id,
        req.params.userId,
        organizationId
    );
    return sendResult(res, result, Response.getDeletedResponse(MessageConstants.ASSIGNMENT_DELETED));
};

methods.bulkUpdateStatus = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await taskServiceInterface.bulkUpdateStatus(req.body, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.TASK_UPDATED));
};

module.exports = methods;
