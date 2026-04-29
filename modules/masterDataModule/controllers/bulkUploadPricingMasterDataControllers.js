const logger = require("@lib/logger");
const { bulkUploadLandRentRatesPricingValidation } = require("../validations/landRentRateValidation");
const { uploadLandRentRatesPricingData } = require("../services/uploadLandRentRatesPricingData");

const bulkUploadLandRentRatesPricingMasterDataController = async (req, res) => {
  try {
    const csvErrors = await uploadLandRentRatesPricingData(req, bulkUploadLandRentRatesPricingValidation);
    res.send({
      success: true,
      message: "Land Rates pricing data uploaded successfully!",
      data: csvErrors,
    });
  } catch (error) {
    logger.error(
      `Error in bulkUploadLandRentRatesPricingMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
  }
};

module.exports = {
  bulkUploadLandRentRatesPricingMasterDataController
};
