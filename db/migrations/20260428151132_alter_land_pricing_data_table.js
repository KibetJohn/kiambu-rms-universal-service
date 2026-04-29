exports.up = async function (knex) {
  await knex.schema.alterTable("land_rate_pricing_data", function (table) {
    table.decimal("rate", 14, 6).notNullable().alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("land_rate_pricing_data", function (table) {
    table.decimal("rate", 14, 2).notNullable().alter();
  });
};
