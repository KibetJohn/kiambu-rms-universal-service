const knex = require("../../../lib/knex");

const updatePricingData = async (
  body,
  condition,
  select = ["*"],
  transaction
) => {
  if (transaction) {
    return await transaction("pricing_data")
      .update(body)
      .where(condition)
      .returning(select);
  } else {
    return await knex("pricing_data")
      .update(body)
      .where(condition)
      .returning(select);
  }
};

const updateLandRentRatePricingData = async (
  body,
  condition,
  select = ["*"],
  transaction
) => {
  if (transaction) {
    return await transaction("land_rate_pricing_data")
      .update(body)
      .where(condition)
      .returning(select);
  } else {
    return await knex("land_rate_pricing_data")
      .update(body)
      .where(condition)
      .returning(select);
  }
};
module.exports = {
  updatePricingData,
  updateLandRentRatePricingData,
};
