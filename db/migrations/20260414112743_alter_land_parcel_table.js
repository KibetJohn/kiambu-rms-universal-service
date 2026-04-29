exports.up = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.string("land_no").nullable().alter();
    table.uuid("parent_parcel_id").nullable().references("id").inTable("land_parcels");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("land_parcels", (table) => {
    table.string("land_no").notNullable().alter();
    table.dropColumn("parent_parcel_id");
  });
};
