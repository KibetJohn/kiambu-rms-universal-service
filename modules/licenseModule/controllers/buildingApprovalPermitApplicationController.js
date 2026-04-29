const logger = require("../../../lib/logger");
const {
  submitBuildingPermitApplicationService,
  buildingApprovalPermitDetails,
  buildingApprovalDuplicateCheckService,
  saveDraftBuildingApplicationService,
} = require("../services/buildingApprovalService");

const submitBuildingPermitApplicationController = async (req, res) => {
  try {
    res.send({
      message: "Application Submitted Successfully!",
      data: await submitBuildingPermitApplicationService(req),
    });
  } catch (error) {
    logger.error(`Error in submitBuildingPermitApplicationController: ${error?.message}`, { error });
    throw error;
  }
};

const submitDraftDevelopmentApplicationController = async (req, res) => {
  try {
    res.send({
      message: "Application Draft Saved Successfully!",
      data: await saveDraftBuildingApplicationService(req),
    });
  } catch (error) {
    logger.error(`Error in submitDraftDevelopmentApplicationController: ${error?.message}`, { error });
    throw error;
  }
};

const buildingApprovalPermitDetailsController = async (req, res) => {
  try {
    const data = await buildingApprovalPermitDetails(
      req.params.id,
      req.headers
    );

    res.send({
      success: true,
      message: "Building Approval details fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(
      `Error in buildingApprovalPermitDetailController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const checkDuplicateBuildingPermitController = async (req, res) => {
  try {
    const permit = await buildingApprovalDuplicateCheckService(req);

    if (permit) {
      return res.status(200).send({
        success: true,
        data: {
          exists: true,
          message: 'Application for this category and sub-category already exists.',
        },
      });
    }

    return res.status(200).send({
      success: true,
      data: {
        exists: false,
      },
    });
  } catch (error) {
    logger.error(
      `Error in checkDuplicateBuildingPermitController: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

module.exports = {
  submitBuildingPermitApplicationController,
  buildingApprovalPermitDetailsController,
  checkDuplicateBuildingPermitController,
  submitDraftDevelopmentApplicationController,
};
