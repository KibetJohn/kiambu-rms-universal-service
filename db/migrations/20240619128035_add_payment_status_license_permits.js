const appConstants = require("../../constant/appConstants");

exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("is_active");
    table.enu("payment_status", [
      appConstants.PAYMENT_STATUS.PAID,
      appConstants.PAYMENT_STATUS.FAIL,
      appConstants.PAYMENT_STATUS.NOT_PAID,
      appConstants.PAYMENT_STATUS.PENDING,
    ]);
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("payment_status");
  });
