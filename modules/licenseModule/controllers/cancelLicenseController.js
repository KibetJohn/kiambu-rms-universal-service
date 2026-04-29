const appConstants = require("../../../constant/appConstants");
const { toSentenceCase } = require("../../../lib/helper");
const { sendNotification } = require("../../../lib/rabbitMq");
const {
  cancelLicenseService,
} = require("../services/licensePermitDetailsService");
const { notifySevice } = require("../services/notifyService");

const cancelLicenseController = async (req, res) => {
  const { permitId } = req.params;
  const { reason } = req.query;
  const data = await cancelLicenseService(permitId, reason, req.headers);

  notifySevice({
    user_id: data.userId,
    subject: `${toSentenceCase(data?.serviceName)}- License Cancelled`,
    message: `Your ${data?.serviceName} license has been cancelled for the application number ${data.applicationRefNumber}. Please login to your county portal account or visit the nearest county offices for more details.`,
  });

  sendNotification(
    JSON.stringify({
      user_id: data.userId,
      message: `Your ${data?.serviceName} license has been cancelled for the application number ${data.applicationRefNumber}`
    }),
    appConstants.QUEUE.NOTIFICATION_LOG_QUEUE
  );

  sendNotification(
    JSON.stringify({
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: data?.serviceName,
      action_details: "License Cancelled.",
      role: req.user.type,
      event_type: "UPDATED",
      device_id: req.user.device_id || null,
      device_type: "WEB",
      elk_ref_id: req.elk_reference_id || "",
      action_performed_on: data.id,
      service: data?.serviceName,
      county_id: req.user.county_id,
    }),
    appConstants.QUEUE.PDSL_AUDIT_QUEUE
  );

  res.send({
    message: "License Cancelled Successfully.",
  });
};

module.exports = {
  cancelLicenseController,
};
