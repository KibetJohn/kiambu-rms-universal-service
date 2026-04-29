
const { getUserIdsByType } = require("../../../lib/api");
const logger = require("../../../lib/logger");
const { issuedPermitCountService } = require("../services/permitService");

const publicPermitIssuedCountController = async (req, res) => {
  try {
    const { user_type } = req.body;
    let userIds = [];
    if (user_type?.length) {
      const { data } = await getUserIdsByType({
        types: user_type
      });
      userIds = data || [];
    }

    const issuedPermits = await issuedPermitCountService(req, userIds);

    res.send({
      message: "Universal services Permit count fetched successfully.",
      data: {
        issuedPermits,
      },
    });
  } catch (error) {
    logger.error(
      `Error in publicPermitIssuedCountController controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = {
  publicPermitIssuedCountController,
};
