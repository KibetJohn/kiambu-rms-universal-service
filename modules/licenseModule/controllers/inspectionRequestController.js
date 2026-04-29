const logger = require("@lib/logger");
const {
  requestInspectionService,
  updateInspectionRequestStatusService,
  submitApplicationInspectionReport,
  getInspectionHistoryListing,
} = require("../services/licenseApplicationService");
const { sendNotification } = require("../../../lib/rabbitMq");
const appConstants = require("../../../constant/appConstants");
const { findOneServiceData } = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");

const inspectionRequestController = async (req, res) => {
  try {
    await requestInspectionService(req);

    res.send({
      success: true,
      message: "Inspection request sent successfully!",
    });
  } catch (error) {
    logger.error(`Error in inspectionRequestController controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const updateInspectionRequestStatusController = async (req, res) => {
  try {
    const { isAccepted } = req.body;
    await updateInspectionRequestStatusService(req);

    res.send({
      success: true,
      message: isAccepted ? "Inspection request accepted successfully!" : "Inspection request rejected successfully!",
    });
  } catch (error) {
    logger.error(`Error in updateInspectionRequestStatusController controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const submitInspectionRequestReportController = async (req, res) => {
  try {
    const data = await submitApplicationInspectionReport(req);

    const [serviceData] = await findOneServiceData({id: data?.serviceId});

    sendNotification(
      JSON.stringify({
        user_id: req.user.id,
        user_name: `${req.user.first_name} ${req.user.last_name}`,
        action: serviceData?.name,
        action_details: "Application Inspection Report Submitted.",
        role: req.user.type,
        event_type: "CREATED",
        device_id: req.user.device_id || null,
        device_type: "WEB",
        elk_ref_id: req.elk_reference_id || "",
        action_performed_on: data.id,
        service: serviceData?.name,
        county_id: req.user.county_id,
      }),
      appConstants.QUEUE.PDSL_AUDIT_QUEUE
    );

    res.send({
      success: true,
      message: 'Inspection report submitted successfully!',
      data
    });
  } catch (error) {
    logger.error(`Error in submitInspectionRequestReportController controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const inspectionHistoryListingController = async (req, res) => {
  try {
    const data = await getInspectionHistoryListing(req);

    res.send({
      success: true,
      message: "Inspection history list fetched successfully!",
      data
    });
  } catch (error) {
    logger.error(`Error in inspectionRequestController controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  inspectionRequestController,
  updateInspectionRequestStatusController,
  submitInspectionRequestReportController,
  inspectionHistoryListingController
};
