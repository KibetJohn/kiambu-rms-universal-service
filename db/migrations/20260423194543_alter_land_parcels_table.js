exports.up = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table
      .uuid("land_zone_id")
      .nullable()
      .references("id")
      .inTable("land_zones")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.string("year").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.dropColumn("land_zone_id");
    table.dropColumn("year");
  });
};
