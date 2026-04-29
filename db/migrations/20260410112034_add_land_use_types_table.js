
exports.up = function (knex) {
  return knex.schema.createTable("land_use_types", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
    table.uuid("service_id").nullable();
    table.uuid("county_id").nullable();
    table.uuid("created_by").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("land_use_types");
};