exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.uuid("application_id");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("application_id");
  });
