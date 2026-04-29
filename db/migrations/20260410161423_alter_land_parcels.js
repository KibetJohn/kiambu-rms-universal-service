exports.up = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.dropColumn("land_use");
    table.uuid("land_use_id").notNullable().references("id").inTable("land_use_types");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.dropColumn("land_use_id");
    table.string("land_use").notNullable();
  });
};
