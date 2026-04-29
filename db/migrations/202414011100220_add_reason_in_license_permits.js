exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.string("cancellation_reason");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("cancellation_reason");
  });
