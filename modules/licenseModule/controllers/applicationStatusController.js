const logger = require("@lib/logger");
const {
  appplicationUpdateService,
  landParcelUpdateService,
} = require("../services/licenseApplicationService");

const applicationStatusController = async (req, res) => {
  try {
    await appplicationUpdateService(req);
    res.send({
      success: true,
      message: "Application status updated successfully!",
    });
  } catch (error) {
    logger.error(`Error in application status controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const landParcelStatusController = async (req, res) => {
  try {
    await landParcelUpdateService(req);
    res.send({
      success: true,
      message: "Land parcel status updated successfully!",
    });
  } catch (error) {
    logger.error(`Error in land parcel status controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  applicationStatusController,
  landParcelStatusController,
};
