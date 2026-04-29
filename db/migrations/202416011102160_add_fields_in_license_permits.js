exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.string("application_owner");
    table.string("id_number");
    table.jsonb("license_data");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("application_owner");
    table.dropColumn("id_number");
    table.dropColumn("license_data");
  });
