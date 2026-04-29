const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) =>
  knex.schema
    .createTable("documents", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
      table.jsonb("documents");
      table.uuid("user_id");
      table
        .uuid("permit_id")
        .references("id")
        .inTable("license_permits")
        .onDelete("CASCADE");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at");
    })
    .then(() => knex.raw(onUpdateTrigger("documents")));

exports.down = (knex) => knex.schema.dropTableIfExists("documents");
