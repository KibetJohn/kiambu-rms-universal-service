const appConstants = require("../../constant/appConstants");

exports.up = (knex) =>
  knex.schema.alterTable("license_bill_requests", (table) => {
    table.enu("status", [
      appConstants.PAYMENT_STATUS.PAID,
      appConstants.PAYMENT_STATUS.NOT_PAID,
      appConstants.PAYMENT_STATUS.FAIL,
      appConstants.PAYMENT_STATUS.PENDING,
    ]);
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_bill_requests", (table) => {
    table.dropColumn("status");
  });
