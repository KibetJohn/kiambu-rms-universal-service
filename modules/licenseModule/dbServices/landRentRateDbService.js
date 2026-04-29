const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");

const getLandRentRateDetails = async (payload) => {
  try {
    const query = await knex("permit_master_data as pmd")
      .leftJoin("pricing_data as pd", "pmd.id", "pd.permit_master_id")
      .leftJoin("services", "services.id", "pmd.service_id")
      .select([
        "pd.sub_county_id as subCountyId",
        "pd.ward_id as wardId",
        "pd.plot_no as plotNo",
        "pd.created_at as createdAt",
        "pmd.public_participation as publicParticipation",
        "pmd.is_certificate_apply as isCertificateApply",
        "pmd.is_partial_payment_allowed as partialPaymentAllowed",
        "pmd.amount_payment_type as duration",
        "pmd.service_id as serviceId",
        "pd.ward_id as wardId",
        "pd.amount as amount",
        "pd.id as pricingDataId",
        "services.name as serviceName",
      ])
      .where({
        "pmd.category_id": payload?.categoryId,
        "pmd.sub_category_id": payload?.subCategoryId,
        "pd.sub_county_id": payload?.subCountyId,
        "pd.ward_id": payload?.wardId,
        "pd.plot_no": payload?.plotNo,
        "pd.is_active": true,
        "pmd.is_active": true,
      });
    return query;
  } catch (error) {
    logger.error("Error while fetching land rent and rate data", error);
    throw error;
  }
};

module.exports = { getLandRentRateDetails };
