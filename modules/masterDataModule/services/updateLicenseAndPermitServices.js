const {
  updateLicenseAndPermitData,
} = require("../dbServices/updateLicenseAndPermitDbServices");
const logger = require("@lib/logger");

const updateLicenseAndPermit = async (body, permitAndLicenseId) => {
  try {
    return updateLicenseAndPermitData({
      body,
      condition: { id: permitAndLicenseId },
      selectFields: ['id'],
    });
  } catch (error) {
    logger.error(
      `Error in updateLicenseAndPermit controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = { updateLicenseAndPermit };
