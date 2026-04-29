exports.up = async function (knex) {
  await knex.schema.createTable("land_rate_pricing_data", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("land_use_id").notNullable();
    table.uuid("path_id").notNullable();
    table.uuid("zone_id").notNullable();

    table.decimal("rate", 14, 2).notNullable();

    table.integer("year").notNullable();

    table
      .timestamp("created_at")
      .defaultTo(knex.fn.now());

    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now());

    table.unique(
      ["land_use_id", "path_id", "zone_id", "year"],
      "land_rate_pricing_data_unique"
    );

    table.index(["land_use_id"]);
    table.index(["path_id"]);
    table.index(["zone_id"]);
    table.index(["year"]);
  });

  await knex.raw(`
    CREATE TRIGGER land_rate_pricing_data_updated_at
    BEFORE UPDATE ON land_rate_pricing_data
    FOR EACH ROW
    EXECUTE FUNCTION on_update_timestamp();
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TRIGGER IF EXISTS land_rate_pricing_data_updated_at
    ON land_rate_pricing_data;
  `);

  await knex.schema.dropTableIfExists("land_rate_pricing_data");
};
