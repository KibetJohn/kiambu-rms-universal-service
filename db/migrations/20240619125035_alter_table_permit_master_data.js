const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) =>
  knex.schema
    .alterTable("permit_master_data", (table) => {
      table.dropColumn("category");
      table.dropColumn("sub_category");

      table.uuid("category_id").notNullable();
      table.uuid("sub_category_id").notNullable();
    })
    .then(() => knex.raw(onUpdateTrigger("permit_master_data")));

exports.down = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.dropColumn("category_id");
    table.dropColumn("sub_category_id");

    table.string("category", 255).notNullable();
    table.string("sub_category", 255).notNullable();
  });
