const logger = require("@lib/logger");
const {
  convertKeysToSnakeCase,
  toSentenceCase,
} = require("../../../lib/helper");
const {
  findOneServiceData,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const errors = require("../../../lib/errors");
const { publicHealthApplicationService, checkDuplicateLicensePermitService } = require("../services/publicHealthService");

const publicHealthApplicationController = async (req, res) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);

    const [serviceData] = await findOneServiceData({ id: req.body.service_id });

    if (!serviceData) throw errors.NOT_FOUND("Service not found.");

    res.send({
      success: true,
      message: `${toSentenceCase(
        serviceData?.name
      )} application submitted successfully!`,
      data: await publicHealthApplicationService(
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
    logger.error(
      `Error in publicHealthApplicationController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const publicHealthPermitCheckController = async (req, res) => {
  try {
    const payload = convertKeysToSnakeCase(req.body);

    const permit = await checkDuplicateLicensePermitService(
      payload,
      req.user.county_id,
      req.user.id
    );

    if (permit) {
      return res.send({
        success: true,
        data: {
          exists: true,
          message: 'Permit of this category and subcategory exists.',
        },
      });
    }

    return res.send({
      success: true,
      data: {
        exists: false,
      },
    });
  } catch (error) {
    logger.error(`Error in publicHealthPermitCheckController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  publicHealthApplicationController,
  publicHealthPermitCheckController,
};
