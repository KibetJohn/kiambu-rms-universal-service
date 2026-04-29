const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) =>
  knex.schema
    .createTable("services", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
      table.string("name", 255).notNullable();
      table.boolean("is_active").defaultTo(true);
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at");
    })
    .then(() => knex.raw(onUpdateTrigger("services")));

exports.down = (knex) => knex.schema.dropTableIfExists("services");
