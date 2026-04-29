exports.up = (knex) =>
  knex.schema.alterTable("pricing_data", (table) => {
    table.uuid("sub_county_id");
    table.uuid("ward_id");
  });

exports.down = (knex) =>
  knex.schema.alterTable("pricing_data", (table) => {
    table.dropColumn("sub_county_id");
    table.dropColumn("ward_id");
  });
