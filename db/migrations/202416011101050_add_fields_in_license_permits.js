exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.uuid("sub_county_id");
    table.uuid("ward_id");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("sub_county_id");
    table.dropColumn("ward_id");
  });
