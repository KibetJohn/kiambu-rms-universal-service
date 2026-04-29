const {
  uploadLicenseAndPermit,
} = require("../services/uploadLicenseAndPermit");
const logger = require("@lib/logger");
const {
  bulkUploadLicenseAndPermitValidation,
  bulkUploadLandRentRatesValidation,
  bulkUploadPublicHealthValidation,
  bulkUploadBuildingApprovalValidation,
} = require("../validations/bulkUploadLicenseAndPermitValidation");

const bulkUploadMasterDataLicenseAndPermitController = async (req, res) => {
  try {
    const csvErrors = await uploadLicenseAndPermit(
      req,
      bulkUploadLicenseAndPermitValidation
    );
    res.send({
      success: true,
      message: "License data uploaded successfully!",
      data: csvErrors,
    });
  } catch (error) {
    logger.error(`Error in bulk upload controller: ${error?.message}`, {
      error,
    });
  }
};

const bulkUploadLandRentRatesMasterDataController = async (req, res) => {
  try {
    const csvErrors = await uploadLicenseAndPermit(
      req,
      bulkUploadLandRentRatesValidation
    );
    res.send({
      success: true,
      message: "Land Rent and Rates master data uploaded successfully!",
      data: csvErrors,
    });
  } catch (error) {
    logger.error(
      `Error in bulk upload bulkUploadLandRentRatesMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
  }
};

const bulkUploadPublicHealthDataController = async (req, res) => {
  try {
    const csvErrors = await uploadLicenseAndPermit(
      req,
      bulkUploadPublicHealthValidation
    );
    res.send({
      success: true,
      message: "Public health master data uploaded successfully.",
      data: csvErrors,
    });
  } catch (error) {
    logger.error(
      `Error in bulk upload public health: ${error?.message}`,
      {
        error,
      }
    );
  }
};

const bulkUploadBuildingApprovalDataController = async (req, res) => {
  try {
    const csvErrors = await uploadLicenseAndPermit(
      req,
      bulkUploadBuildingApprovalValidation
    );
    res.send({
      success: true,
      message: "Building Approval master data uploaded successfully.",
      data: csvErrors,
    });
  } catch (error) {
    logger.error(
      `Error in bulk upload bulkUploadBuildingApprovalDataController: ${error?.message}`,
      {
        error,
      }
    );
  }
};

module.exports = {
  bulkUploadMasterDataLicenseAndPermitController,
  bulkUploadLandRentRatesMasterDataController,
  bulkUploadPublicHealthDataController,
  bulkUploadBuildingApprovalDataController
};
