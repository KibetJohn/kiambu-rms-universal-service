exports.up = async function (knex) {
  await knex.schema.alterTable("subcounty_zone_data", function (table) {
    table.decimal("parcel_value", 14, 2).notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("subcounty_zone_data", function (table) {
    table.dropColumn("parcel_value");
  });
};