exports.up = function (knex) {
  return knex.schema.createTable("subcounty_zone_data", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("land_zone_id")
      .notNullable()
      .references("id")
      .inTable("land_zones")
      .onDelete("CASCADE");
    table.jsonb("zone_data").notNullable();
    table
      .uuid("usv_value_id")
      .notNullable()
      .references("id")
      .inTable("rate_units")
      .onDelete("RESTRICT");
    table.uuid("created_by").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("subcounty_zone_data");
};