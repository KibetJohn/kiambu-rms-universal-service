exports.up = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.float("amount").notNullable().defaultTo(0).alter();
  });

exports.down = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.float("amount").notNullable().alter();
  });
