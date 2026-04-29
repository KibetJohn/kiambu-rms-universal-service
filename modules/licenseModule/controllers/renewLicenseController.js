const logger = require("@lib/logger");
const {
  getRenewLicensePermitList,
} = require("../services/landRentRateService");

const renewLicensePermitListController = async (req, res) => {
  try {
    const data = await getRenewLicensePermitList(req.body, req.query);

    res.send(data);
  } catch (error) {
    logger.error(
      `Error in renewLicensePermitListController controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = {
  renewLicensePermitListController,
};
