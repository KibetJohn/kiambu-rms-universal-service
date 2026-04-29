const logger = require("../../../lib/logger");
const { getPermitList } = require("../services/permitService");

const getPermitListController = async (req, res) => {
  try {
    let data = await getPermitList(req);

    res.send({
      success: true,
      message: "success",
      ...data,
    });
  } catch (error) {
    logger.error(`Error in getPermitListController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  getPermitListController,
};
