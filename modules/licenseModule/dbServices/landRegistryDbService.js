const { redisKeys } = require("../../../constant/redisKeys");
const { convertKeysToCamelCase, toSentenceCase } = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const { getFromRedis } = require("../../../lib/redis");

const insertLandParcel = async (data, transaction) => {
  try {
    return await transaction("land_parcels").insert(data).returning("id");
  } catch (error) {
    logger.error(`Error in insertLandParcel: ${error?.message}`, { error });
    throw error;
  }
};

const fetchLandParcels = async ({
  county_id,
  user_id = null,
  search = null,
  service_id = null,
  limit = null,
  page = null
}) => {

  let matchingSubCountyIds = [];
  const [wards, subCounties] = await Promise.all([
    getFromRedis(redisKeys.wards),
    getFromRedis(redisKeys.subCounties),
  ]);

  if (search && subCounties) {
    matchingSubCountyIds = Object.entries(subCounties)
      .filter(([, val]) => val.name.toLowerCase().includes(search.toLowerCase()))
      .map(([id]) => id);
  }

  const parcels = await knex("land_parcels as lps")
    .select(
      "lps.id",
      "lps.user_id",
      "lps.service_id",
      "lps.first_name",
      "lps.last_name",
      "lps.other_name",
      "lps.identification_number",
      "lps.kra_pin",
      "lps.mobile_number",
      "lps.email",
      "lps.land_size",
      "lps.land_no",
      "lps.sub_county_id",
      "lps.ward_id",
      "lps.longitude",
      "lps.latitude",
      "lps.village",
      "lps.land_use_id",
      "lps.current_land_use",
      "lps.land_status",
      "lps.application_status",
      "lps.payment_status",
      "lps.application_id",
      "lps.uploaded_documents_id",
      "lps.created_at",
      "lps.land_zone_id",
      "lps.year",
      "s.name as service_name",
      "d.documents as uploaded_documents",
      "lus.name as land_use_name",
      "lz.name as zone_name",
      "lz.code as zone_code",
      "szd.usv_value_id as rate_unit_id",
      "ru.name as rate_unit",
      "lrpd.path_id",
      "lrpd.rate",
      "pc.name as path_name",
      "pc.code as path_code",
    )
    .join("services as s", "s.id", "lps.service_id")
    .leftJoin("documents as d", "d.id", "lps.uploaded_documents_id")
    .leftJoin("land_use_types as lus", "lus.id", "lps.land_use_id")
    .leftJoin("land_zones as lz", "lz.id", "lps.land_zone_id")
    .leftJoin(
      knex.raw(`(
        SELECT DISTINCT ON (land_zone_id)
          land_zone_id,
          usv_value_id
        FROM subcounty_zone_data
        ORDER BY land_zone_id, created_at DESC
      ) AS szd`),
      "szd.land_zone_id",
      "lps.land_zone_id"
    )
    .leftJoin("rate_units as ru", "ru.id", "szd.usv_value_id")
    .leftJoin("land_rate_pricing_data as lrpd", function () {
      this.on("lrpd.zone_id", "lps.land_zone_id")
        .andOn("lrpd.land_use_id", "lps.land_use_id")
        .andOnVal("lrpd.year", knex.raw("lps.year::integer"));
    })
    .leftJoin("path_codes as pc", "pc.id", "lrpd.path_id")
    .where({ "lps.county_id": county_id })
    .modify((qb) => {
      if (user_id) qb.where("lps.user_id", user_id);
      if (search) {
        qb.andWhere((builder) => {
          builder
            .orWhereRaw("(lps.land_no ILIKE ? OR lps.parent_land_no ILIKE ?)", [`%${search}%`, `%${search}%`])
            .orWhereRaw("lps.first_name ILIKE ?", [`%${search}%`])
            .orWhereRaw("lps.last_name ILIKE ?", [`%${search}%`])
            .orWhereRaw("lps.land_size ILIKE ?", [`%${search}%`])
            .orWhereRaw("lus.name ILIKE ?", [`%${search}%`]);

          if (matchingSubCountyIds.length) {
            builder.orWhereIn("lps.sub_county_id", matchingSubCountyIds);
          }
        });
      }
      if (service_id) qb.where("lps.service_id", service_id);
      if (limit && page) {
        qb.limit(limit).offset((page - 1) * limit);
      }
    })
    .orderBy("lps.created_at", "desc");

  return parcels.map((row) => {
    const landData = convertKeysToCamelCase(row);
    if (wards) {
      const ward = wards[landData.wardId];
      landData.ward = ward ? toSentenceCase(ward.name) : null;
    }
    if (subCounties) {
      const subCounty = subCounties[landData.subCountyId];
      landData.subCounty = subCounty ? toSentenceCase(subCounty.name) : null;
    }
    return landData;
  });
};

const getZoneDataBySubCounty = async (sub_county_id) => {
  return await knex("subcounty_zone_data")
    .whereRaw("zone_data->'sub_counties' @> ?::jsonb", [JSON.stringify([sub_county_id])])
    .select("land_zone_id", "usv_value_id as rate_unit_id")
    .first();
};

const getPricingDataByZone = async ({ zone_id, land_use_id, year }) => {
  return await knex("land_rate_pricing_data")
    .where({ zone_id, land_use_id, year })
    .select("*")
    .first();
};


module.exports = {
  insertLandParcel,
  fetchLandParcels,
  getZoneDataBySubCounty,
  getPricingDataByZone,
};
