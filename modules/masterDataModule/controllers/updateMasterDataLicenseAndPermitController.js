const appConstants = require("../../../constant/appConstants");
const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const { convertKeysToSnakeCase } = require("../../../lib/helper");
const { sendNotification } = require("../../../lib/rabbitMq");
const {
  updateLicenseAndPermitData,
} = require("../dbServices/updateLicenseAndPermitDbServices");
const logger = require("@lib/logger");
const {
  findOneLicenseAndPermit,
} = require("../services/uploadLicenseAndPermit");
const {
  checkAndUpdateCategory,
  checkAndUpdateSubCategory,
} = require("../dbServices/licenseAndPermitsDbServices");
const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const { fetchServices } = require("../services/service");

const updateLicenseAndPermitController = async (req, res) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const user = req.user || {};
    req.body = convertKeysToSnakeCase(req.body);

    const {
      application_fee,
      public_participation,
      board_approval,
      amount,
      permit_fee,
      period,
      service_id,
    } = req.body;

    const [service] = await fetchServices({ id: service_id });

    if (!service) {
      throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);
    }

    if (service.name === appConstants.SERVICES.LIQUOR && !period) {
      throw errors.INVALID_INPUT("Period is required for LIQUOR service.");
    }

    await editMasterData(req, user, transaction);

    const updatePayload = {
      amount: application_fee ? amount : 0,
      permit_fee,
      application_fee,
      board_approval,
      public_participation,
    };

    if (service.name === appConstants.SERVICES.LIQUOR) {
      updatePayload.period = period;
    }

    const [licensePermit] = await updateLicenseAndPermitData(
      updatePayload,
      { id: req.params.id },
      ["id"],
      transaction
    );

    sendNotification(
      JSON.stringify({
        user_id: user.id,
        user_name: `${user.first_name} ${user.last_name}`,
        action: appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT,
        action_details: `Master data Updated.`,
        role: user.type,
        event_type: "UPDATED",
        device_id: user.device_id || null,
        device_type: "WEB",
        elk_ref_id: req.elk_reference_id || "",
        action_performed_on: licensePermit.id,
        service: appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT,
        county_id: user.county_id,
      }),
      appConstants.QUEUE.PDSL_AUDIT_QUEUE
    );
    await transaction.commit();
    res.send({
      success: true,
      message: "License and Permit data updated successfully!",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error in update license and permit controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const editMasterData = async (req, user, transaction) => {
  try {
    const { category, sub_category, service_id } = req.body;

    const masterData = await findOneLicenseAndPermit({ id: req.params.id });

    if (!masterData) {
      throw errors.NOT_FOUND(errorConstants.PRICING_DATA_NOT_EXIST);
    }

    const categoryDetails = await checkAndUpdateCategory(
      {
        category,
        county_id: user.county_id,
        category_id: masterData?.category_id,
        service_id,
      },
      transaction
    );

    const subCategoryDetails = await checkAndUpdateSubCategory(
      {
        sub_category,
        category_id: categoryDetails?.id,
        sub_category_id: masterData?.sub_category_id,
      },
      transaction
    );
    return {
      categoryDetails,
      subCategoryDetails,
    };
  } catch (error) {
    logger.error(`Error in edit master data: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const updateLandRentRatesMasterDataController = async (req, res) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const user = req.user || {};
    req.body = convertKeysToSnakeCase(req.body);
    const {
      amount_payment_type,
      is_partial_payment_allowed,
      is_certificate_apply,
    } = req.body;

    await editMasterData(req, user, transaction);

    const [licensePermit] = await updateLicenseAndPermitData(
      {
        amount_payment_type,
        is_partial_payment_allowed,
        is_certificate_apply,
      },
      { id: req.params.id },
      ["id"],
      transaction
    );

    sendNotification(
      JSON.stringify({
        user_id: user.id,
        user_name: `${user.first_name} ${user.last_name}`,
        action: appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT,
        action_details: `Master data Updated.`,
        role: user.type,
        event_type: "UPDATED",
        device_id: user.device_id || null,
        device_type: "WEB",
        elk_ref_id: req.elk_reference_id || "",
        action_performed_on: licensePermit.id,
        service: appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT,
        county_id: user.county_id,
      }),
      appConstants.QUEUE.PDSL_AUDIT_QUEUE
    );
    await transaction.commit();
    res.send({
      success: true,
      message: "Master data updated successfully!",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error in updateLandRentRatesMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const updatePublicHealthController = async (req, res) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const user = req.user || {};
    req.body = convertKeysToSnakeCase(req.body);
    const [serviceData] = await fetchServices({ id: req?.body?.service_id });

    if (
      serviceData.name != appConstants.SERVICES.BUILDING_APPROVAL &&
      req?.body?.permit_fee == 0
    ) {
      throw errors.INVALID_INPUT("Permit Fee must be greater than zero(0).");
    }

    const {
      application_fee,
      is_application_fee,
      is_board_approval,
      is_public_participation,
      permit_fee,
      amount_payment_type,
    } = req.body;

    const { categoryDetails, subCategoryDetails } = await editMasterData(
      req,
      user,
      transaction
    );

    const [updatePermit] = await updateLicenseAndPermitData(
      {
        amount: is_application_fee ? application_fee : 0,
        permit_fee,
        application_fee: is_application_fee,
        board_approval: is_board_approval,
        public_participation: is_public_participation,
        amount_payment_type,
        category_id: categoryDetails.id,
        sub_category_id: subCategoryDetails.id,
      },
      { id: req.params.id },
      ["id"],
      transaction
    );

    const action =
      serviceData?.name === appConstants.SERVICES.BUILDING_APPROVAL
        ? appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT
        : appConstants.AUDIT_CONSTANTS.PUBLIC_HEALTH;

    sendNotification(
      JSON.stringify({
        user_id: user.id,
        user_name: `${user.first_name} ${user.last_name}`,
        action,
        action_details: `Master data Updated.`,
        role: user.type,
        event_type: "UPDATED",
        device_id: user.device_id || null,
        device_type: "WEB",
        elk_ref_id: req.elk_reference_id || "",
        action_performed_on: updatePermit.id,
        service: serviceData.name,
        county_id: user.county_id,
      }),
      appConstants.QUEUE.PDSL_AUDIT_QUEUE
    );
    await transaction.commit();
    res.send({
      success: true,
      message: "Public health data updated successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error in update public health controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = {
  updateLicenseAndPermitController,
  updateLandRentRatesMasterDataController,
  updatePublicHealthController,
};
