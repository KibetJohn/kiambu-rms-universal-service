const { redisKeys } = require("../../../constant/redisKeys");
const { convertKeysToSnakeCase } = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const { getFromRedis } = require("../../../lib/redis");
const errors = require("../../../lib/errors");

const subcountyZoneService = async (body, userId) => {
  body = convertKeysToSnakeCase(body);
  const { land_zone_id, sub_counties, usv_value_id, value } = body;

  const existingRows = await knex("subcounty_zone_data")
    .whereNot({ land_zone_id })
    .select("zone_data", "land_zone_id");

  const alreadyAssigned = new Map(); 
  for (const row of existingRows) {
    const subs = row.zone_data?.sub_counties ?? [];
    for (const subId of subs) {
      alreadyAssigned.set(subId, row.land_zone_id);
    }
  }
  
  const conflicts = sub_counties.filter((id) => alreadyAssigned.has(id));
  if (conflicts.length > 0) {
    throw new Error(
      `The following subcounties are already assigned to another zone: ${conflicts.join(", ")}`
    );
  }

  const [data] = await knex("subcounty_zone_data")
    .insert({
      land_zone_id,
      zone_data: JSON.stringify({ sub_counties }),
      usv_value_id,
      parcel_value: value,
      created_by: userId,
    })
    .returning("id");

  return data;
};

const fetchSubcountyZoneData = async (query) => {
  let { limit, page } = query;

  limit = limit ? parseInt(limit, 10) : null;
  page = page ? parseInt(page, 10) : null;

  const select = [
    "subcounty_zone_data.id",
    "subcounty_zone_data.land_zone_id",
    "subcounty_zone_data.zone_data",
    "subcounty_zone_data.usv_value_id",
    "subcounty_zone_data.parcel_value as value",
    "land_zones.name as zone_name",
    "land_zones.code as zone_code",
    "rate_units.name as rate_unit",
  ];

  const dbQuery = knex("subcounty_zone_data")
    .select(select)
    .join("land_zones", "land_zones.id", "subcounty_zone_data.land_zone_id")
    .join("rate_units", "rate_units.id", "subcounty_zone_data.usv_value_id");

  if (limit && page) {
    const offset = (page - 1) * limit;
    dbQuery.limit(limit).offset(offset);
  }

  const list = await dbQuery;

  const subCounties = await getFromRedis(redisKeys.subCounties);

  if (Array.isArray(list) && subCounties) {
    for (const row of list) {
      const subcountyIds = row.zone_data?.sub_counties || [];
      row.subcounty_names = subcountyIds.map((id) => {
        const subCounty = subCounties[id];
        return subCounty ? subCounty.name : null;
      }).filter(Boolean);
    }
  }

  return list || [];
};

const updateSubcountyZoneService = async (id, body, userId) => {
  const { land_zone_id, sub_counties, usv_value_id, value } = convertKeysToSnakeCase(body);

  const [existing] = await knex("subcounty_zone_data").where({ id });
  if (!existing) {
    throw errors.NOT_FOUND("Zone-subcounty record not found.");
  }

  const conflictingRows = await knex("subcounty_zone_data")
    .whereNot({ id })
    .select("land_zone_id", "zone_data");

  const alreadyAssigned = new Map(); 
  for (const row of conflictingRows) {
    const subs = row.zone_data?.sub_counties ?? [];
    for (const subId of subs) {
      alreadyAssigned.set(subId, row.land_zone_id);
    }
  }

  const conflicts = sub_counties.filter((subId) => alreadyAssigned.has(subId));
  if (conflicts.length > 0) {
    throw errors.CONFLICT(
      `The following subcounties are already assigned to another zone: ${conflicts.join(", ")}`
    );
  }

  await knex("subcounty_zone_data")
    .where({ id })
    .update({
      land_zone_id,
      zone_data: JSON.stringify({ sub_counties }),
      usv_value_id,
      parcel_value: value,
      updated_at: knex.fn.now(),
      ...(userId ? { created_by: userId } : {}),
    });

  return { id };
};

module.exports = {
    subcountyZoneService,
    fetchSubcountyZoneData,
    updateSubcountyZoneService,
};