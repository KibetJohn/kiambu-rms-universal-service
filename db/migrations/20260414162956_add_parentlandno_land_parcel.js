exports.up = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.string("parent_land_no").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.dropColumn("parent_land_no");
  });
};

