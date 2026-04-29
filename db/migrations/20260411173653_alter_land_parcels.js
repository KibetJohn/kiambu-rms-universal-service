exports.up = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.string("sub_type").nullable();
    table.string("permit_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.dropColumn("sub_type");
    table.dropColumn("permit_id");
  });
};