const logger = require("../../../lib/logger");
const {
  checkLicenseApplicationService,
} = require("../services/licenseApplicationService");

const checkLicenseApplicationController = async (req, res) => {
  try {
    res.send({
      message: "License application status fetched successfully",
      data: await checkLicenseApplicationService(req.body),
    });
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

module.exports = {
  checkLicenseApplicationController,
};
