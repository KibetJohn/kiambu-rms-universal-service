const appConstants = require("../../constant/appConstants");

exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.enu("permit_payment_status", [
      appConstants.PAYMENT_STATUS.PAID,
      appConstants.PAYMENT_STATUS.NOT_PAID,
      appConstants.PAYMENT_STATUS.FAIL,
      appConstants.PAYMENT_STATUS.PENDING,
    ]);
    table.uuid("permit_payment_id");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("permit_payment_status");
    table.dropColumn("permit_payment_id");
  });
