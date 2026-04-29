const logger = require("@lib/logger");
const {
  getApplicationPaymentHistory,
} = require("../services/licenseApplicationService");

const getApplicationPaymentHistoryController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Application Payment History fetched successfully!",
      ...await getApplicationPaymentHistory(req)
    });
  } catch (error) {
    logger.error(`Error in getApplicationPaymentHistoryController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  getApplicationPaymentHistoryController,
};
