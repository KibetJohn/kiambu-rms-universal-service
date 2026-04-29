exports.up = async function (knex) {
  await knex.schema.alterTable("land_rate_pricing_data", function (table) {
    table.string("rate_unit").nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("land_rate_pricing_data", function (table) {
    table.dropColumn("rate_unit");
  });
};