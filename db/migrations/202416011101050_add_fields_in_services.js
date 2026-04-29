exports.up = (knex) =>
  knex.schema.alterTable("services", (table) => {
    table.string("module");
  });

exports.down = (knex) =>
  knex.schema.alterTable("services", (table) => {
    table.dropColumn("module");
  });
