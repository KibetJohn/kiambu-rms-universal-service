const knex = require("../../../lib/knex");

const updateLicenseBill = async (updateBody, condition, transaction) => {
  if (transaction) {
    return transaction("license_bill_requests")
      .update(updateBody)
      .where(condition)
      .returning("");
  } else {
    return await knex("license_bill_requests")
      .update(updateBody)
      .where(condition)
      .returning("*");
  }
};

module.exports = {
  updateLicenseBill,
};
