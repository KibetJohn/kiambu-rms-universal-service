const logger = require("../../../lib/logger");
const { getPermitDetails } = require("../services/permitService");

const getPermitDetailsController = async (req, res) => {
  try {
    const data = await getPermitDetails(req.params.id, req.headers);

    res.send({
      success: true,
      message: "Permit details fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(`Error in fetching permit details: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const getPermitController = async (req, res) => {
  try {
    const data = await getPermitDetails(req.params.id,null,{ isInternal: true });

    res.send({
      success: true,
      message: "Permit details fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(`Error in fetching permit details: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  getPermitDetailsController,
  getPermitController,
};
