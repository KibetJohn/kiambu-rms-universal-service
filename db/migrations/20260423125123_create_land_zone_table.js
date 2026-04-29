exports.up = function (knex) {
  return knex.schema.createTable("land_zones", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable().unique();
    table.string("code").notNullable().unique();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("land_zones");
};
