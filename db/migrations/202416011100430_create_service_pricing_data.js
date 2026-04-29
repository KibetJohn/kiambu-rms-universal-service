const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) =>
  knex.schema
    .createTable("pricing_data", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
      table.boolean("is_active").defaultTo(true);
      table
        .uuid("permit_master_id")
        .references("id")
        .inTable("permit_master_data")
        .onDelete("CASCADE");
      table
        .uuid("service_id")
        .references("id")
        .inTable("services")
        .onDelete("CASCADE");
      table.string("plot_no");
      table.float("amount").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at");
    })
    .then(() => knex.raw(onUpdateTrigger("pricing_data")));

exports.down = (knex) => knex.schema.dropTableIfExists("pricing_data");
