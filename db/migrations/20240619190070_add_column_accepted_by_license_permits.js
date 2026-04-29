exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.uuid("accepted_by");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("accepted_by");
  });
