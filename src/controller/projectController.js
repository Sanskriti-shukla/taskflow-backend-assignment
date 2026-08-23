const ProjectServices = require('../services/projectService');
const projectServiceInterface = new ProjectServices();
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

methods.createProject = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await projectServiceInterface.createProject(req.body, organizationId);
    return sendResult(res, result, Response.getCreatedResponse(MessageConstants.PROJECT_CREATED));
};

methods.getAllProjects = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await projectServiceInterface.getAllProjects(req.query, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.SUCCESS));
};

methods.getProjectById = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await projectServiceInterface.getProjectById(req.params.id, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.SUCCESS));
};

methods.updateProject = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await projectServiceInterface.updateProject(req.params.id, req.body, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.PROJECT_UPDATED));
};

methods.deleteProject = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await projectServiceInterface.deleteProject(req.params.id, organizationId);
    return sendResult(res, result, Response.getDeletedResponse(MessageConstants.PROJECT_DELETED));
};

methods.getDashboard = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await projectServiceInterface.getDashboard(req.params.id, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.SUCCESS));
};

module.exports = methods;
