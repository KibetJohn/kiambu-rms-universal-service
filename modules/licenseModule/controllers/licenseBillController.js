const appConstants = require("../../../constant/appConstants");
const { toSentenceCase } = require("../../../lib/helper");
const { sendNotification } = require("../../../lib/rabbitMq");
const {
  licenseBillRequestService,
  payBillService,
  billListService,
} = require("../services/billService");
const { notifySevice } = require("../services/notifyService");

const billRequestController = async (req, res) => {
  const data = await licenseBillRequestService(
    { ...req.body, submittedBy: req.user.id },
    req.headers
  );

  notifySevice({
    user_id: data.userId,
    subject: `${toSentenceCase(data?.serviceName)}- Bill Request`,
    message: `A new bill has been sent for your ${data?.serviceName} application number ${data.applicationRefNumber}. Please login to your county portal account or visit the nearest county offices for more details.`,
  });

  sendNotification(
    JSON.stringify({
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: data?.serviceName,
      action_details: "Generate Bill Request.",
      role: req.user.type,
      event_type: "CREATED",
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
    message: "Bill generated successfully!",
    data,
  });
};

const billListingController = async (req, res) => {
  res.send({
    message: "Bill List fetched successfully.",
    data: await billListService(req.params.id, req.query, req.headers),
  });
};

const payBillController = async (req, res) => {
  res.send({
    message: "Bill payment paid successfully.",
    data: await payBillService(req.body, req.headers, req.user.id, req.query),
  });
};

module.exports = {
  billRequestController,
  payBillController,
  billListingController,
};
