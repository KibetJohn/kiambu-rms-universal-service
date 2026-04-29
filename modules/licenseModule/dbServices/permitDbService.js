const { redisKeys } = require("../../../constant/redisKeys");
const { convertKeysToCamelCase, toSentenceCase } = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const { getFromRedis } = require("../../../lib/redis");

const fetchLicensePermitDetails = async (body) => {
  try {
    const [listingData] = await knex("permit_master_data")
      .select("*")
      .where(body);
    return convertKeysToCamelCase(listingData);
  } catch (error) {
    logger.error("Error while fetching license permit details:", error);
    throw error;
  }
};

const fetchPermitDetails = async (
  condition,
  select = ["*"],
  whereNotCondition,
  leftJoinConditions = []
) => {
  try {
    const permitQuery = knex("license_permits").select(select).where(condition);

    if (whereNotCondition) {
      permitQuery.whereNot(whereNotCondition);
    }

    if (Array.isArray(leftJoinConditions) && leftJoinConditions.length > 0) {
      leftJoinConditions.forEach((join) => {
        if (Array.isArray(join) && join.length === 3) {
          permitQuery.leftJoin(join[0], join[1], join[2]);
        }
      });
    }

    const [permitData] = await permitQuery;
    return convertKeysToCamelCase(permitData);
  } catch (error) {
    console.error("Error in fetching Permit details", error);
    throw error;
  }
};

const licensePermitService = async (body, transaction) => {
  try {
    if (transaction)
      return await transaction("license_permits").insert(body).returning("id");
    else return knex("license_permits").insert(body).returning("id");
  } catch (error) {
    logger.error("Error in creating license permits:", error);
    throw error;
  }
};

const fetchLicenseApplicationStatus = async (body, queryParams = {}) => {
  const {
    whereInCondition,
    whereRawCondition,
    medicalStaffJoin = false,
    masterDataJoin = false,
  } = queryParams;

  let query;  
  if (medicalStaffJoin) {
    query = knex("license_permits")
      .leftJoin(
        "medical_staff_permits as msp",
        "msp.permit_id",
        "license_permits.id"
      )
      .select(
        "license_permits.id",
        knex.raw(
          "COALESCE(license_permits.application_status,msp.application_status) as application_status"
        ),
        knex.raw(
          "COALESCE(license_permits.permit_status, msp.permit_status) as permit_status"
        ),
        "license_permits.user_id",
        "license_permits.uploaded_documents_id",
        knex.raw(
          "COALESCE(license_permits.application_id, msp.application_id) as application_id"
        ),
        "license_permits.service_id",
        "license_permits.county_id",
        "license_permits.payment_status",
        "license_permits.business_name",
        "license_permits.business_registration_no",
        knex.raw(
          "COALESCE(license_permits.permit_master_id,msp.permit_master_id) as permit_master_id"
        ),
        "msp.id as staff_permit_id",
        "license_permits.application_for_staff",
        "license_permits.ward_id as wardId"
      );
  } else {
    query = knex("license_permits").select(
      "license_permits.id",
      "license_permits.application_status",
      "license_permits.permit_status",
      "license_permits.user_id",
      "license_permits.uploaded_documents_id",
      "license_permits.application_id",
      "license_permits.service_id",
      "license_permits.county_id",
      "license_permits.payment_status",
      "license_permits.business_name",
      "license_permits.business_registration_no",
      "license_permits.permit_master_id",
      "license_permits.ward_id as wardId",
      "license_permits.street",
      "license_permits.plot_number",
      "license_permits.floor_number",
      "license_permits.stall_number",
      "license_permits.building_name",
      "license_permits.po_box",
      "license_permits.postal_code",
      "license_permits.period",
      "license_permits.sub_type",
      "license_permits.land_parcel_id",
      "license_permits.license_data",
    );
  }

  if (masterDataJoin) {
    query
      .leftJoin(
        "permit_master_data",
        "permit_master_data.id",
        "license_permits.permit_master_id"
      )
      .select("permit_master_data.permit_fee");
  }

  if (body) {
    query.where(body);
  }
  if (whereInCondition) {
    query.whereIn(whereInCondition);
  }
  if (whereRawCondition) {
    query.whereRaw(whereRawCondition);
  }
  const data = await query;

  const wards = await getFromRedis(redisKeys.wards);
  if (Array.isArray(data) && wards) {
    for (const row of data) {
      const ward = wards[row.wardId];
      row.ward = ward ? toSentenceCase(ward.name) : null;
    }
  }
  return data;
};

/**
 * get expiry date
 * @param {*} date
 */
const getExpiryDate = (type, numberOfMonths = 1) => {
  const expiryDate = new Date();
  const currentYear = expiryDate.getFullYear();
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 0);

  switch (type) {
    case "MONTHLY":
      expiryDate.setMonth(expiryDate.getMonth() + +numberOfMonths);
      break;

    case "QUARTERLY":
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      break;

    case "HALF_YEARLY":
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      break;

    case "FULL_YEAR":
    case "FULL_YEARLY":
    case "ANNUAL":
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
  }

  // Ensure expiry date does not exceed December 31st of the current year
  if (expiryDate > yearEnd) {
    return yearEnd;
  }

  expiryDate.setHours(23, 59, 59, 0);

  return expiryDate;
};

const updateLicensePermit = async (body, permitId, transaction) => {
  if (transaction)
    return await transaction("license_permits")
      .update(body)
      .where({ id: permitId })
      .returning("id");
  else
    return await knex("license_permits")
      .update(body)
      .where({ id: permitId })
      .returning("id");
};

const getExpiryDateForLiquor = (selectedPeriod) => {
  const now = new Date();
  let expiryDate = new Date(now);
  const currentYear = expiryDate.getFullYear();
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 0);

  switch (selectedPeriod) {
    case '1 Day':
      expiryDate.setDate(now.getDate() + 1);
      break;

    case 'Less than 6 Months':
      expiryDate.setMonth(now.getMonth() + 6);
      expiryDate.setDate(expiryDate.getDate() - 1);
      break;

    case 'Annual':
    case 'ANNUAL':
      expiryDate.setFullYear(now.getFullYear() + 1);
      break;

    default:
      expiryDate.setMonth(now.getMonth() + 6);
      expiryDate.setDate(expiryDate.getDate() - 1);
      break;
  }

  if (expiryDate > yearEnd) {
    return yearEnd;
  }

  expiryDate.setHours(23, 59, 59, 0);

  return expiryDate;
};

module.exports = {
  fetchLicensePermitDetails,
  fetchPermitDetails,
  licensePermitService,
  fetchLicenseApplicationStatus,
  getExpiryDate,
  updateLicensePermit,
  getExpiryDateForLiquor,
};
