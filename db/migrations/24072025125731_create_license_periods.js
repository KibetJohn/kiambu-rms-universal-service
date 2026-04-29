const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) =>
  knex.schema.createTable("license_periods", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));

    table.string("period", 20).notNullable();
    table.boolean("is_active").defaultTo(true);

    table
      .timestamp("created_at").defaultTo(knex.fn.now());

    table
      .timestamp("updated_at")
      .defaultTo(null);
  }).then(() => knex.raw(onUpdateTrigger("license_periods")));

exports.down = (knex) => knex.schema.dropTableIfExists("license_periods");