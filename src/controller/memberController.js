const MemberServices = require('../services/memberService');
const memberServiceInterface = new MemberServices();
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

methods.getAllMembers = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await memberServiceInterface.getAllMembers(organizationId);
    return sendResult(res, result, Response.getOkResponse(MessageConstants.SUCCESS));
};

methods.addMember = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await memberServiceInterface.addMember(req.body, organizationId);
    return sendResult(res, result, Response.getCreatedResponse(MessageConstants.MEMBER_CREATED));
};

methods.updateMemberRole = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const currentUserId = req.user.data.id;
    const result = await memberServiceInterface.updateMemberRole(
        req.params.userId,
        req.body,
        organizationId,
        currentUserId
    );
    return sendResult(res, result, Response.getOkResponse(MessageConstants.MEMBER_UPDATED));
};

methods.deleteMember = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const currentUserId = req.user.data.id;
    const result = await memberServiceInterface.deleteMember(
        req.params.userId,
        organizationId,
        currentUserId
    );
    return sendResult(res, result, Response.getDeletedResponse(MessageConstants.MEMBER_DELETED));
};

module.exports = methods;
