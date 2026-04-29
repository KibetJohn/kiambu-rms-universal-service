const logger = require("@lib/logger");
const errors = require("../../../lib/errors");
const { convertKeysToSnakeCase, convertKeysToCamelCase, toSentenceCase } = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const { fetchLandUseTypesFromDb, insertLandUseTypes, updateLandUseType } = require("./landUseService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");


const addMasterDataLandUseService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const { name, status, service_id, county_id } = req.body;

    const existing = await fetchLandUseTypesFromDb({ name, service_id });
    if (existing.length) {
      throw errors.ALREADY_EXISTS(`Land use type '${name}' already exists.`);
    }

    const [insertedLandUseType] = await insertLandUseTypes({
      name,
      status,
      service_id,
      county_id: county_id || null,
      created_by: req.user?.id,
    });

    return { id: insertedLandUseType };
  } catch (error) {
    logger.error(`Error in addMasterDataLandUseService: ${error?.message}`, { error });
    throw error;
  }
};

const getLandUseService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    req.query = convertKeysToSnakeCase(req.query);

    const { service_id, county_id } = req.body;
    const { name, limit, page } = req.query;

    return await fetchLandUseTypes({ service_id, county_id, name, limit, page });
  } catch (error) {
    logger.error(`Error in getLandUseService: ${error?.message}`, { error });
    throw error;
  }
};

const fetchLandUseTypes = async ({ service_id, county_id = null, name = null, limit = null, page = null }) => {
  limit = limit ? parseInt(limit, 10) : null;
  page = page ? parseInt(page, 10) : null;

  const landUseTypes = await knex("land_use_types")
    .select(
      "id",
      "name",
      "status",
      "county_id",
      "service_id",
      "created_at",
    )
    .where({ service_id })
    .modify((qb) => {
      if (county_id) qb.where({ county_id });
      if (name) qb.whereILike("name", `%${name}%`);
      if (limit && page) qb.limit(limit).offset((page - 1) * limit);
    })
    .orderBy("created_at", "desc");

  return landUseTypes.map((row) => convertKeysToCamelCase(row));
};

const updateLandUseService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);

    const { id } = req.params;
    const { name, status, service_id, county_id } = req.body;

    const [existing] = await fetchLandUseTypesFromDb({ id });
    if (!existing) throw errors.NOT_FOUND("Land use type not found.");

    const duplicate = await fetchLandUseTypesFromDb({ name, service_id })
      .then((results) => results.find((row) => row.id !== id));
    if (duplicate) {
      throw errors.ALREADY_EXISTS(`Land use type '${name}' already exists.`);
    }

    await updateLandUseType(
      {
        name,
        status,
        service_id,
        county_id: county_id || null,
        created_by: req.user?.id,
        updated_at: knex.fn.now(),
      },
      { id }
    );

    return { id };
  } catch (error) {
    logger.error(`Error in updateLandUseService: ${error?.message}`, { error });
    throw error;
  }
};

const searchSubcountyZoneDataService = async ({ searchTerm }) => {
  try {
    let matchingSubCountyIds = [];

    const subCounties = await getFromRedis(redisKeys.subCounties);

    if (searchTerm && subCounties) {
      matchingSubCountyIds = Object.entries(subCounties)
        .filter(([, val]) => val.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(([id]) => id);
    }

    let query = knex("subcounty_zone_data")
      .select(
        "subcounty_zone_data.id",
        "subcounty_zone_data.zone_data",
        "subcounty_zone_data.parcel_value",
        "subcounty_zone_data.created_at",
        "land_zones.id as zoneId",
        "land_zones.code as zoneCode",
        "land_zones.name as zoneName",
        "rate_units.id as computationTypeId",
        "rate_units.name as computationTypeName"
      )
      .leftJoin("land_zones", "land_zones.id", "subcounty_zone_data.land_zone_id")
      .leftJoin("rate_units", "rate_units.id", "subcounty_zone_data.usv_value_id");

    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(land_zones.name) LIKE ?", [`%${term}%`])
          .orWhereRaw("LOWER(land_zones.code) LIKE ?", [`%${term}%`])
          .orWhereRaw("LOWER(rate_units.name) LIKE ?", [`%${term}%`])

        if (matchingSubCountyIds.length) {
          builder.orWhereRaw(
            `subcounty_zone_data.zone_data->'sub_counties' ??| ARRAY[${matchingSubCountyIds.map(() => "?").join(",")}]::text[]`,
            matchingSubCountyIds
          );
        }
      });
    }

    query = query.orderBy("subcounty_zone_data.created_at", "DESC");

    const rows = await query;

    return rows.map((row) => {
      const data = convertKeysToCamelCase(row);
      const subCountyIds = row.zone_data?.sub_counties || [];
      data.subCounties = subCountyIds
        .map((id) => {
          const sc = subCounties?.[id];
          return sc ? { id, name: toSentenceCase(sc.name) } : { id, name: null };
        });
      return data;
    });
  } catch (error) {
    logger.error(`Error in searchSubcountyZoneDataService: ${error?.message}`, { error });
    throw error;
  }
};

module.exports = {
  addMasterDataLandUseService,
  getLandUseService,
  updateLandUseService,
  searchSubcountyZoneDataService,
};