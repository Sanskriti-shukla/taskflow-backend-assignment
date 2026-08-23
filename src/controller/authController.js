const AuthServices = require('../services/authService');
const authServiceInterface = new AuthServices();
const methods = {};
const Response = require('../constants/Response');
const GeneralResponse = require('../constants/GeneralResponse');
const MessageConstants = require('../constants/MessageConstant');

const sendResult = (res, result, successResponse) => {
    if (!result.success) {
        return GeneralResponse(
            res,
            result.details,
            Response.getErrorResponse(result.httpStatus, result.body, result.code)
        );
    }
    return GeneralResponse(res, result.body, successResponse);
};

methods.register = async (req, res) => {
    const result = await authServiceInterface.register(req.body);
    return sendResult(res, result, Response.getCreatedResponse(MessageConstants.REGISTER_SUCCESSFULLY));
};

methods.login = async (req, res) => {
    const result = await authServiceInterface.login(req.body);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.LOGIN_SUCCESSFULLY));
};

methods.refresh = async (req, res) => {
    const result = await authServiceInterface.refresh(req.body);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.TOKEN_REFRESHED));
};

methods.logout = async (req, res) => {
    const result = await authServiceInterface.logout(req.body);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.LOGOUT_SUCCESSFULLY));
};

methods.logoutAll = async (req, res) => {
    const userId = req.user.data.id;
    const organizationId = req.user.data.organizationId;
    const result = await authServiceInterface.logoutAll(userId, organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.LOGOUT_SUCCESSFULLY));
};

module.exports = methods;
