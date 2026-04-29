exports.up = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.float("permit_fee").notNullable().defaultTo('0');
  });

exports.down = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.dropColumn("permit_fee");
  });
