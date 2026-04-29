const errors = require("../../../lib/errors");
const knex = require("../../../lib/knex");
const logger = require("@lib/logger");
const {
  fetchMasterData,
} = require("../../licenseModule/services/categoryService");
const {
  findExistingCategory,
  findExistingSubCategory,
  findExistingPathCode,
  findExistingZones,
} = require("../dbServices/licenseAndPermitsDbServices");
const { fetchServices } = require("./service");
const promisify = require("../../../lib/async");
const { updatePricingData, updateLandRentRatePricingData } = require("../dbServices/pricingDbService");
const { fetchDetailsFromRedis, getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const { toSentenceCase } = require("../../../lib/helper");

const pricingDataService = async (body) => {
  try {
    const pathCode = await findExistingPathCode(
      { id: body?.pathId },
    );
    if (!pathCode)
      throw errors.NOT_FOUND("Path code does not exists.");

    const zone = await findExistingZones({id: body?.zoneId});
    if (!zone)
      throw errors.NOT_FOUND("Zone does not exists.");

    const [services] = await fetchServices({
      id: body?.serviceId,
      is_active: true,
    });
    if (!services) throw errors.NOT_FOUND("Service not found.");

    const [pricing] = await insertLandRentRatePricingData(
      {
        land_use_id: body?.landUseId,
        path_id: body?.pathId,
        zone_id: body?.zoneId,
        rate: body?.rate,
        year: body?.year,
        rate_unit: body?.rateUnit,
      },
      { select: ["id "] }
    );

    return {
      pricingId: pricing?.id,
      services,
    };
  } catch (error) {
    console.log("Error inserting pricing", error);
    throw error;
  }
};

const insertPricingData = async (body, queryParams = {}, transaction) => {
  const { select = ["*"] } = queryParams;
  if (transaction) {
    return await transaction("pricing_data").insert(body).returning(select);
  } else {
    return await knex("pricing_data").insert(body).returning(select);
  }
};

const fetchPricingData = async (queryParams = {}) => {
  const {
    whereCondition = {},
    select,
    whereNotCondition = {},
    limit,
    page,
    order,
    search,
    leftJoinConditions = []
  } = queryParams;
  const query = knex("pricing_data").select(select);

  if (Object.keys(whereCondition).length > 0) {
    query.where(whereCondition);
  }
  if (whereNotCondition && Object.keys(whereNotCondition).length > 0) {
    query.whereNot(whereNotCondition);
  }
  if (limit && page) {
    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);
  }
  if (order) {
    query.orderBy("created_at", order ? order : "DESC");
  }
  if (search) {
    query.where("plot_no", "ilike", `%${search}%`);
  }
  if (Array.isArray(leftJoinConditions) && leftJoinConditions.length > 0) {
    leftJoinConditions.forEach((join) => {
      if (Array.isArray(join) && join.length === 3) {
        query.leftJoin(join[0], join[1], join[2]);
      }
    });
  }
  return await query;
};

const pricingListService = async (query) => {
  const { limit, page, search, order } = query;

  let listQuery = knex("land_rate_pricing_data")
    .select(
      "land_rate_pricing_data.id",
      "land_rate_pricing_data.rate",
      "land_rate_pricing_data.year",
      "land_rate_pricing_data.path_id as pathId",
      "land_rate_pricing_data.zone_id as zoneId",
      "land_rate_pricing_data.land_use_id as landUseId",
      "land_rate_pricing_data.rate_unit as rateUnit",
      "land_zones.code as zoneCode",
      "path_codes.code as pathCode",
      "land_use_types.name as landUseName",
    )
    .leftJoin(
      "land_zones",
      "land_zones.id",
      "land_rate_pricing_data.zone_id"
    )
    .leftJoin("path_codes", "path_codes.id", "land_rate_pricing_data.path_id")
    .leftJoin("land_use_types", "land_use_types.id", "land_rate_pricing_data.land_use_id");

  let countQuery = knex("land_rate_pricing_data")
    .count({ total: "land_rate_pricing_data.id" })
    .leftJoin(
      "land_zones",
      "land_zones.id",
      "land_rate_pricing_data.zone_id"
    )
    .leftJoin("path_codes", "path_codes.id", "land_rate_pricing_data.path_id")
    .leftJoin("land_use_types", "land_use_types.id", "land_rate_pricing_data.land_use_id");

  if (search) {
    const searchFilter = (query) =>
      query
        .where("land_zones.name", "like", `%${search}%`)
        .orWhere("land_zones.code", "like", `%${search}%`)
        .orWhere("path_codes.code", "like", `%${search}%`)
        .orWhere("path_codes.name", "like", `%${search}%`);
    listQuery.andWhere(searchFilter);
    countQuery.andWhere(searchFilter);
  }

  listQuery.orderBy("land_rate_pricing_data.created_at", order ? order : "DESC");

  if (limit && page) {
    const offset = (page - 1) * limit;
    listQuery.limit(limit).offset(offset);
  }

  let [data, countResult] = await Promise.all([listQuery, countQuery]);

  let pricingList = data.map((item) => {

    return {
      ...item,
      pathCode: toSentenceCase(item.pathCode),
      zoneCode: toSentenceCase(item.zoneCode),
      landUseName: toSentenceCase(item.landUseName),
      rateUnit: toSentenceCase(item.rateUnit),
    };
  });

  const totalCount = countResult[0]?.total || 0;

  return {
    pricingList,
    totalCount,
  };
};

const pricingExportService = async (query) => {
  const { search, order } = query;

  let listQuery = knex("land_rate_pricing_data")
    .select(
      "land_use_types.name as Land_Use_Name",
      "path_codes.code as Path_Code",
      "land_zones.code as Zone_Code",
      "land_rate_pricing_data.year as Year",
      "land_rate_pricing_data.rate as Rate_Value",
      "land_rate_pricing_data.rate_unit as Rate_Unit"
    )
    .leftJoin(
      "land_use_types",
      "land_use_types.id",
      "land_rate_pricing_data.land_use_id"
    )
    .leftJoin(
      "path_codes",
      "path_codes.id",
      "land_rate_pricing_data.path_id"
    )
    .leftJoin(
      "land_zones",
      "land_zones.id",
      "land_rate_pricing_data.zone_id"
    );

  if (search) {
    const searchFilter = (q) =>
      q
        .where(knex.raw("LOWER(land_use_types.name)"), "like", `%${search.toLowerCase()}%`)
        .orWhere(knex.raw("LOWER(path_codes.code)"), "like", `%${search.toLowerCase()}%`)
        .orWhere(knex.raw("LOWER(land_zones.code)"), "like", `%${search.toLowerCase()}%`)
        .orWhere(knex.raw("CAST(land_rate_pricing_data.year AS TEXT)"), "like", `%${search}%`);
    listQuery.andWhere(searchFilter);
  }

  listQuery.orderBy("land_rate_pricing_data.created_at", order || "DESC");

  const data = await listQuery;

  return data.map((item) => ({
    Land_Use_Name: item.Land_Use_Name,
    Path_Code:     item.Path_Code,
    Zone_Code:     item.Zone_Code,
    Year:          item.Year,
    Rate_Value:    item.Rate_Value,
    Rate_Unit:     item.Rate_Unit,
  }));
};

const pricingEditService = async (body, pricingDataId) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const pathCode = await findExistingPathCode(
      { id: body?.pathId },
    );
    if (!pathCode)
      throw errors.NOT_FOUND("Path code does not exists.");

    const zone = await findExistingZones({id: body?.zoneId});
    if (!zone)
      throw errors.NOT_FOUND("Zone does not exists.");

    const [services] = await fetchServices({
      id: body?.serviceId,
      is_active: true,
    });
    if (!services) throw errors.NOT_FOUND("Service not found.");


    await updateLandRentRatePricingData(
      {
        land_use_id: body?.landUseId,
        path_id: body?.pathId,
        zone_id: body?.zoneId,
        rate: body?.rate,
        year: body?.year,
        rate_unit: body?.rateUnit,
      },
      {
        id: pricingDataId,
      },
      ["id"],
      transaction
    );
    await transaction.commit();

    return {
      pricingId: pricingDataId,
      services,
    };
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    throw error;
  }
};

const insertLandRentRatePricingData = async (body, queryParams = {}, transaction) => {
  const { select = ["*"] } = queryParams;
  if (transaction) {
    return await transaction("land_rate_pricing_data").insert(body).returning(select);
  } else {
    return await knex("land_rate_pricing_data").insert(body).returning(select);
  }
};

const searchLandRentPricingService = async ({ searchTerm, landUseId, pathId, zoneId, rateUnit }) => {
  try {
    let query = knex("land_rate_pricing_data")
      .select(
        "land_rate_pricing_data.id",
        "land_rate_pricing_data.rate",
        "land_rate_pricing_data.year",
        "land_rate_pricing_data.rate_unit",
        "land_use_types.id as landUseId",
        "land_use_types.name as landUseName",
        "path_codes.id as pathId",
        "path_codes.code as pathCode",
        "path_codes.name as pathName",
        "land_zones.id as zoneId",
        "land_zones.code as zoneCode",
        "land_zones.name as zoneName"
      )
      .leftJoin("land_use_types", "land_use_types.id", "land_rate_pricing_data.land_use_id")
      .leftJoin("path_codes", "path_codes.id", "land_rate_pricing_data.path_id")
      .leftJoin("land_zones", "land_zones.id", "land_rate_pricing_data.zone_id");

    if (landUseId) {
      query = query.where("land_rate_pricing_data.land_use_id", landUseId);
    }
    if (pathId) {
      query = query.where("land_rate_pricing_data.path_id", pathId);
    }
    if (zoneId) {
      query = query.where("land_rate_pricing_data.zone_id", zoneId);
    }
    if (rateUnit) {
      query = query.where("land_rate_pricing_data.rate_unit", rateUnit);
    }

    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      query = query.andWhere((builder) => {
        builder
          .whereRaw("LOWER(land_use_types.name) LIKE ?", [`%${term}%`])
          .orWhereRaw("LOWER(path_codes.code) LIKE ?", [`%${term}%`])
          .orWhereRaw("LOWER(path_codes.name) LIKE ?", [`%${term}%`])
          .orWhereRaw("LOWER(land_zones.code) LIKE ?", [`%${term}%`])
          .orWhereRaw("LOWER(land_zones.name) LIKE ?", [`%${term}%`])
          .orWhereRaw("CAST(land_rate_pricing_data.rate AS TEXT) LIKE ?", [`%${term}%`]);
      });
    }

    query = query.orderBy("land_rate_pricing_data.created_at", "DESC");

    return await query;
  } catch (error) {
    logger.error(`Error in searchLandRentPricingService: ${error?.message}`, { error });
    throw error;
  }
};

module.exports = {
  pricingDataService,
  pricingListService,
  fetchPricingData,
  insertPricingData,
  pricingExportService,
  pricingEditService,
  insertLandRentRatePricingData,
  searchLandRentPricingService,
};
