const logger = require("@lib/logger");
const { convertKeysToSnakeCase } = require("../../../lib/helper");
const {
  licenseApplicationService,
  licenceDuplicateCheckService,
  publicPermitDataService,
  licensePermitDataService,
} = require("../services/licenseApplicationService");
const {
  findOneServiceData,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const appConstants = require("../../../constant/appConstants");
const errors = require("../../../lib/errors");

const licenseApplicationController = async (req, res) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const [serviceData] = await findOneServiceData({ id: req.body.service_id });

    if (!serviceData) throw errors.NOT_FOUND("Service not found.");
    if (
      serviceData &&
      serviceData.id === req.body.service_id &&
      serviceData.name === appConstants.SERVICES.LAND_AND_PROPERTIES &&
      !req.body.plot_number
    ) {
      throw errors.INVALID_INPUT("Plot number is required");
    }

    if (
      serviceData &&
      serviceData.id === req.body.service_id &&
      (
        serviceData.name === appConstants.SERVICES.LIQUOR || 
        serviceData.name === appConstants.SERVICES.ADVERTISEMENT
      ) && 
      (
        !req.body.street ||
        !req.body.po_box ||
        !req.body.postal_code
      )
    ) {
      throw errors.INVALID_INPUT("Street, P.O. Box, and Postal Code are required for Liquor or Advertisement services.");
    }

    if (
      serviceData &&
      serviceData.id === req.body.service_id &&
      serviceData.name === appConstants.SERVICES.LIQUOR &&
      !req.body.period
    ) {
      throw errors.INVALID_INPUT("Period is required");
    }
    res.send({
      success: true,
      message: "License Permit application submitted successfully!",
      data: await licenseApplicationService(
        req.body,
        req.headers,
        req.user.county_id,
        req.user.id,
        req.query,
        false,
        serviceData
      ),
    });
  } catch (error) {
    logger.error(`Error in license application controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const licenceDuplicateCheckController = async (req, res) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);

    const {
      category_id,
      sub_category_id,
      service_id,
      sub_county_id
    } = req.body;

    const user_id = req.user.id;
    const county_id = req.user.county_id;

    const permit = await licenceDuplicateCheckService({
      category_id,
      sub_category_id,
      service_id,
      user_id,
      county_id,
      sub_county_id
    });

    if (permit) {
      return res.status(200).send({
        success: true,
        data: {
          exists: true,
          message: 'Application for this category and sub-category already exists for that subCounty',
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
    logger.error(`Error in licence duplicate check controller: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const publicPermitDataController = async (req, res) => {
  try {
    const { referenceNumber } = req.params;

    const permit = await publicPermitDataService(referenceNumber);

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: `Permit with reference number ${referenceNumber} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: permit,
    });

  } catch (error) {
    logger.error(`Error in publicPermitDataController: ${error.message}`, {
      error
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const licensePermitDataController = async (req, res) => {
  try {
    const { referenceNumber } = req.params;

    const permit = await licensePermitDataService(referenceNumber);

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: `Permit with reference number ${referenceNumber} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: permit,
    });

  } catch (error) {
    logger.error(`Error in licensePermitDataController: ${error.message}`, {
      error
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  licenseApplicationController,
  licenceDuplicateCheckController,
  publicPermitDataController,
  licensePermitDataController,
};
