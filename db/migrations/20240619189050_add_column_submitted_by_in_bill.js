exports.up = (knex) =>
  knex.schema.alterTable("license_bill_requests", (table) => {
    table.uuid("submitted_by");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_bill_requests", (table) => {
    table.dropColumn("submitted_by");
  });
