const logger = require("../../../lib/logger");
const knex = require("../../../lib/knex");

const getActiveMasterDataLicenseAndPermit = async (
  body,
  selectFields = ["*"],
  countyId,
  serviceId = null,
  whereNotCondition = null,
  whereNotInCondition = null,
  whereInCondition = null
) => {
  try {
    const { page = 1, limit = 20, search, orderBy = "desc" } = body;

    const offSet = (page - 1) * limit;
    let query = knex("permit_master_data")
      .select(selectFields)
      .leftJoin("category", "category.id", "permit_master_data.category_id")
      .leftJoin(
        "sub_category",
        "sub_category.id",
        "permit_master_data.sub_category_id"
      )
      .leftJoin("services", "services.id", "permit_master_data.service_id")
      .where({
        "permit_master_data.county_id": countyId,
        "permit_master_data.is_active": true,
      });

    if (serviceId) {
      query.where("permit_master_data.service_id", serviceId);
    }

    if (whereNotCondition) {
      query.whereNot(whereNotCondition);
    }

    if (whereNotInCondition) {
      const { column, values } = whereNotInCondition; // Ensure proper structure
      if (column && Array.isArray(values) && values.length > 0) {
        query.whereNotIn(column, values);
      }
    }

    if (whereInCondition) {
      const { column, values } = whereInCondition;
      if (column && Array.isArray(values) && values.length > 0) {
        query.whereIn(column, values);
      }
    }

    query
      .limit(limit)
      .offset(offSet)
      .orderBy("permit_master_data.created_at", orderBy);

    if (search) {
      query = query.andWhere(function () {
        this.where("category.name", "like", `%${search}%`).orWhere(
          "sub_category.name",
          "like",
          `%${search}%`
        );
      });
    }

    const data = await query;
    const totalRecords = data?.[0]?.totalrecords || 0;
    data.forEach((item) => delete item.totalrecords);

    return {
      data,
      totalPages: Math.ceil(totalRecords / limit),
      totalCount: totalRecords,
    };
  } catch (error) {
    logger.error(
      `Error in fetching license permit details controller: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = getActiveMasterDataLicenseAndPermit;
