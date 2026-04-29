const knex = require("../../../lib/knex");
const { zonesData } = require("../seeds/landZoneData");

const getZones = async (query) => {
  const { isActive = "true" } = query;
  let zones = await fetchZones();

  if (!zones.length) {
    zones = await insertZones(zonesData);
  } else {
    const newZonesData = [];
    const updatedZonesData = [];

    zonesData.forEach((zoneData) => {
      const existing = zones.find((z) => z.name === zoneData.name);

      if (existing) {
        if (
          existing.is_active !== zoneData.is_active ||
          existing.code !== zoneData.code
        ) {
          updatedZonesData.push({
            id: existing.id,
            is_active: zoneData.is_active,
            code: zoneData.code,
          });
        }
      } else {
        newZonesData.push(zoneData);
      }
    });

    if (updatedZonesData.length > 0) {
      await Promise.all(
        updatedZonesData.map((zone) =>
          updateZones(
            { is_active: zone.is_active, code: zone.code },
            { id: zone.id }
          )
        )
      );
    }

    if (newZonesData.length > 0) {
      await insertZones(newZonesData);
    }
  }

  return await fetchZones({ is_active: isActive });
};

const fetchZones = async (condition, select = ["*"]) => {
  const query = knex("land_zones").select(select);
  if (condition) query.where(condition);
  return await query;
};

const insertZones = async (body, select = ["*"]) => {
  return await knex("land_zones").insert(body).returning(select);
};

const updateZones = async (body, condition) => {
  return await knex("land_zones").update(body).where(condition).returning("*");
};

module.exports = {
    fetchZones,
    insertZones,
    updateZones,
    getZones,
};
