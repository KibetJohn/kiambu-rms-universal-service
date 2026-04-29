const { successConstants } = require("@constant/successConstants");
const getActiveMasterDataLicenseAndPermit = require("../services/licenseAndPermitServices");
const logger = require("@lib/logger");
const { fetchServices } = require("../services/service");
const appConstants = require("../../../constant/appConstants");
const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const { toSentenceCase } = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const { masterDataList } = require("../dbServices/addOneLicenseAndPermitDbServices");

const getMasterDataLicenseAndPermitController = async (req, res) => {
  try {
    const serviceNames = [
      appConstants.SERVICES.LIQUOR,
      appConstants.SERVICES.LAND_AND_PROPERTIES,
      appConstants.SERVICES.ADVERTISEMENT,
    ];

    const services = await fetchServices((builder) =>
      builder.whereIn("name", serviceNames)
    );

    let whereInCondition;
    if (services && services.length > 0) {
      whereInCondition = {
        column: "permit_master_data.service_id",
        values: services.map((service) => service.id),
      };
    }

    const licenseAndPermitData = await getActiveMasterDataLicenseAndPermit(
      req.query,
      [
        "permit_master_data.id",
        "permit_master_data.category_id as categoryId",
        "permit_master_data.sub_category_id as subCategoryId",
        "permit_master_data.amount",
        "permit_master_data.public_participation as publicParticipation",
        "permit_master_data.application_fee as applicationFee",
        "permit_master_data.board_approval as boardApproval",
        "category.name as category",
        "sub_category.name as subCategory",
        "permit_master_data.service_id as serviceId",
        "services.name as serviceName",
        "permit_master_data.permit_fee as permitFee",
        "permit_master_data.period as period",
        knex.raw("COUNT(*) OVER() as totalRecords"),
      ],
      req.user.county_id,
      null,
      null,
      null,
      whereInCondition
    );

    licenseAndPermitData.data.forEach((item) => {
      item.serviceName = toSentenceCase(item.serviceName);
      item.category = toSentenceCase(item.category);
      item.subCategory = toSentenceCase(item.subCategory);
    });

    res.send({
      message: successConstants.SUCCESS,
      ...licenseAndPermitData,
    });
  } catch (error) {
    logger.error(
      `Error in fetching license and permit controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const getLandRentRatesListMasterDataController = async (req, res) => {
  try {
    const [service] = await fetchServices({
      name: appConstants.SERVICES.LAND_RENT_AND_RATES,
    });

    if (!service) throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);

    const licenseAndPermitData = await getActiveMasterDataLicenseAndPermit(
      req.query,
      [
        "permit_master_data.id",
        "permit_master_data.amount_payment_type as amountPaymentType",
        "permit_master_data.is_partial_payment_allowed as isPartialPaymentAllowed",
        "permit_master_data.is_certificate_apply as isCertificateApply",
        "permit_master_data.category_id as categoryId",
        "category.name as category",
        "permit_master_data.sub_category_id as subCategoryId",
        "sub_category.name as subCategory",
        "permit_master_data.service_id as serviceId",
        "services.name as serviceName",
        knex.raw("COUNT(*) OVER() as totalRecords"),
      ],
      req.user.county_id,
      service.id
    );

    licenseAndPermitData.data.forEach((item) => {
      item.amountPaymentType = toSentenceCase(item.amountPaymentType);
      item.serviceName = toSentenceCase(item.serviceName);
      item.category = toSentenceCase(item.category);
      item.subCategory = toSentenceCase(item.subCategory);
    });

    res.send({
      message: successConstants.SUCCESS,
      ...licenseAndPermitData,
    });
  } catch (error) {
    logger.error(
      `Error in getLandRentRatesListMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const getPublicHealthListController = async (req, res) => {
  try {
    const serviceNames = [
      appConstants.SERVICES.MEDICAL_CERTIFICATE,
      appConstants.SERVICES.FOOD_HYGIENE,
      appConstants.SERVICES.OCCUPATIONAL_CERTIFICATE,
    ];

    const masterData = await masterDataList(req, serviceNames);

    res.send({
      message: successConstants.SUCCESS,
      ...masterData,
    });
  } catch (error) {
    logger.error(
      `Error in fetching the public health master data: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const getBuildingApprovalListController = async (req, res) => {
  try {
    const serviceNames = [
      appConstants.SERVICES.BUILDING_APPROVAL,
    ];

    const masterData = await masterDataList(req, serviceNames);

    res.send({
      message: successConstants.SUCCESS,
      ...masterData,
    });
  } catch (error) {
    logger.error(
      `Error in fetching the getBuildingApprovalListController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const getLicensePeriodController = async (req, res) => {
  try {
    const { subCategoryId, serviceId } = req.body;

    if (!subCategoryId || !serviceId) {
      return res.status(400).json({
        message: "subCategoryId and serviceId are required",
      });
    }

    const result = await knex("permit_master_data")
      .select("id", "period")
      .where({
        sub_category_id: subCategoryId,
        service_id: serviceId,
      })
      .first();

    if (!result) {
      return res.status(404).json({ message: "No record found" });
    }

    return res.json({
      message: "Success",
      data: result,
    });
  } catch (error) {
    logger.error(
      `Error in getLicensePeriodController: ${error?.message}`,
      { error }
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMasterDataLicenseAndPermitController,
  getLandRentRatesListMasterDataController,
  getPublicHealthListController,
  getBuildingApprovalListController,
  getLicensePeriodController,
};
