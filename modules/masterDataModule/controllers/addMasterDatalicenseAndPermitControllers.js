const { successConstants } = require("../../../constant/successConstants");
const {
  checkCategoryAndSubCategoryUnique,
} = require("../dbServices/licenseAndPermitsDbServices");
const {
  addOneLicenseAndPermit,
} = require("../dbServices/addOneLicenseAndPermitDbServices");
const logger = require("@lib/logger");
const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const { sendNotification } = require("../../../lib/rabbitMq");
const appConstants = require("../../../constant/appConstants");
const { convertKeysToSnakeCase } = require("../../../lib/helper");
const { fetchServices } = require("../services/service");
const errors = require("../../../lib/errors");
const { errorConstants } = require("../../../constant/errorConstants");

const commonService = [
  appConstants.SERVICES.MEDICAL_CERTIFICATE,
  appConstants.SERVICES.FOOD_HYGIENE,
  appConstants.SERVICES.OCCUPATIONAL_CERTIFICATE,
  appConstants.SERVICES.BUILDING_APPROVAL
];

const addMasterDataLicenseAndPermitController = async (req, res) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const countyId = req.user.county_id;

    const [service] = await fetchServices({ id: req.body.service_id });

    if (!service) throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);

    if (service?.name != appConstants.SERVICES.BUILDING_APPROVAL && req?.body?.permit_fee == 0) {
      throw errors.INVALID_INPUT("Permit Fee must be greater than zero(0).");
    }

    if (service.name === appConstants.SERVICES.LIQUOR && !req.body.period) {
      throw errors.INVALID_INPUT("Period is required for LIQUOR service.");
    }
    
    const data = await checkCategoryAndSubCategoryUnique(
      {
        county_id: countyId,
        category: req.body.category,
        sub_category: req.body.sub_category,
        service_id: req.body.service_id,
      },
      transaction
    );

    delete req.body.category;
    delete req.body.sub_category;

    let insertPayload;
    if (commonService.includes(service.name)) {
      const { is_board_approval, is_application_fee, is_public_participation } =
        req.body;

      delete req.body.is_application_fee;
      delete req.body.is_board_approval;
      delete req.body.is_public_participation;

      insertPayload = {
        ...req.body,
        county_id: countyId,
        sub_category_id: data?.subCategoryId,
        category_id: data?.categoryId,
        amount: req.body.application_fee,
        application_fee: is_application_fee,
        board_approval: is_board_approval,
        public_participation: is_public_participation,
      };
    } else {
      insertPayload = {
        ...req.body,
        county_id: countyId,
        sub_category_id: data?.subCategoryId,
        category_id: data?.categoryId,
      };
    }

    const [licensePermitId] = await addOneLicenseAndPermit(
      insertPayload,
      transaction
    );

    const action =
      service?.name === appConstants.SERVICES.BUILDING_APPROVAL
        ? appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT
        : appConstants.AUDIT_CONSTANTS.PUBLIC_HEALTH;

    sendNotification(
      JSON.stringify({
        user_id: req.user.id,
        user_name: `${req.user.first_name} ${req.user.last_name}`,
        action,
        action_details: `Master data Added.`,
        role: req.user.type,
        event_type: "CREATED",
        device_id: req.user.device_id || null,
        device_type: "WEB",
        elk_ref_id: req.elk_reference_id || "",
        action_performed_on: licensePermitId,
        service: service?.name,
        county_id: countyId,
      }),
      appConstants.QUEUE.PDSL_AUDIT_QUEUE
    );

    await transaction.commit();

    res.send({
      success: true,
      message: successConstants.MASTER_DATA_ADDED,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error in adding license and permit master data controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = {
  addMasterDataLicenseAndPermitController,
};
