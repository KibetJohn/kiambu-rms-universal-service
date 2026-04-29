const logger = require("@lib/logger");
const {
  updateLicensePaymentStatus,
} = require("../services/licensePermitDetailsService");

const updateLicenseController = async (req, res) => {
  try {

    await updateLicensePaymentStatus(req.body, req.params.id, req.headers);
    res.send({
      success: true,
      message: "License Permit updated successfully!",
    });
  } catch (error) {
    logger.error(`Error in license application controller: ${error?.message}`, {
      error,
    });
    console.error("Error in update license controller", error);
    throw error;
  }
};

module.exports = {
  updateLicenseController,
};
