exports.up = function (knex) {
  return knex.schema.alterTable("license_permits", (table) => {
    table.string("sub_type").nullable();
    table.string("land_parcel_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("sub_type");
    table.dropColumn("land_parcel_id");
  });
};