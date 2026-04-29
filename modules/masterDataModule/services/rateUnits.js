const knex = require("../../../lib/knex");
const { rateUnitData } = require("../seeds/rateUnitData");

const getRateUnits = async (query = {}) => {
  const { isActive = "true" } = query;
  let rateUnits = await fetchRateUnits();

  if (!rateUnits.length) {
    rateUnits = await insertRateUnits(rateUnitData);
  } else {
    const newRateUnitsData = [];
    const updatedRateUnitsData = [];

    rateUnitData.forEach((rateUnit) => {
      const existing = rateUnits.find((r) => r.name === rateUnit.name);

      if (existing) {
        if (existing.is_active !== rateUnit.is_active) {
          updatedRateUnitsData.push({
            id: existing.id,
            is_active: rateUnit.is_active,
          });
        }
      } else {
        newRateUnitsData.push(rateUnit);
      }
    });

    if (updatedRateUnitsData.length > 0) {
      await Promise.all(
        updatedRateUnitsData.map((rateUnit) =>
          updateRateUnits({ is_active: rateUnit.is_active }, { id: rateUnit.id })
        )
      );
    }

    if (newRateUnitsData.length > 0) {
      await insertRateUnits(newRateUnitsData);
    }
  }

  return await fetchRateUnits({ is_active: isActive });
};

const fetchRateUnits = async (condition, select = ["*"]) => {
  const query = knex("rate_units").select(select);
  if (condition) query.where(condition);
  return await query;
};

const insertRateUnits = async (body, select = ["*"]) => {
  return await knex("rate_units").insert(body).returning(select);
};

const updateRateUnits = async (body, condition) => {
  return await knex("rate_units").update(body).where(condition).returning("*");
};

module.exports = {
    fetchRateUnits,
    insertRateUnits,
    updateRateUnits,
    getRateUnits,
};