const appConstants = require("../../../constant/appConstants");
const { toSentenceCase } = require("../../../lib/helper");
const { sendNotification } = require("../../../lib/rabbitMq");
const { notifySevice } = require("../services/notifyService");
const { documentRequestService } = require("../services/uploadDocumentService");

const documentRequestController = async (req, res) => {
  const data = await documentRequestService(req);

  notifySevice({
    user_id: req.body.userId,
    subject: `${toSentenceCase(data?.serviceName)}-Document Request`,
    message: `${data.responseMessage} Please login to your county portal account or visit the nearest county offices for more details.`,
  });

  sendNotification(
    JSON.stringify({
      user_id: data.userId,
      message: data.responseMessage,
    }),
    appConstants.QUEUE.NOTIFICATION_LOG_QUEUE
  );

  sendNotification(
    JSON.stringify({
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: data?.serviceName,
      action_details: `${toSentenceCase(req.body.type)} Document.`,
      role: req.user.type,
      event_type: "CREATED",
      device_id: req.user.device_id || null,
      device_type: "WEB",
      elk_ref_id: req.elk_reference_id || "",
      action_performed_on: data,
      service: data?.serviceName,
      county_id: req.user.county_id,
    }),
    appConstants.QUEUE.PDSL_AUDIT_QUEUE
  );

  res.send({
    message: data.responseMessage,
    data: data.updateResult,
  });
};

module.exports = {
  documentRequestController,
};
