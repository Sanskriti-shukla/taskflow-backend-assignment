const JobServices = require('../services/jobService');
const jobServiceInterface = new JobServices();
const methods = {};
const Response = require('../constants/Response');
const GeneralResponse = require('../constants/GeneralResponse');
const MessageConstants = require('../constants/MessageConstant');

methods.getJobStatus = async (req, res) => {
    const organizationId = req.user.data.organizationId;
    const result = await jobServiceInterface.getJobStatus(req.params.id, organizationId);

    if (!result.success) {
        return GeneralResponse(res, result.details, Response.getErrorResponse(result.httpStatus, result.body, result.code));
    }

    return GeneralResponse(res, result.body, Response.getOkResponse(MessageConstants.SUCCESS));
};

module.exports = methods;
