exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.uuid("inspection_requested_by");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("inspection_requested_by");
  });
