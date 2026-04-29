const knex = require("../../../lib/knex");

const updateLicenseAndPermitData = async (
  body,
  condition,
  selectFields = ["*"],
  transaction
) => {
  let query = "";

  if (transaction)
    query = transaction("permit_master_data")
      .returning(selectFields)
      .update(body)
      .orderBy("created_at", "desc");
  else
    query = knex("permit_master_data")
      .returning(selectFields)
      .update(body)
      .orderBy("created_at", "desc");

  if (condition) query.where(condition);

  return await query;
};

module.exports = { updateLicenseAndPermitData };
