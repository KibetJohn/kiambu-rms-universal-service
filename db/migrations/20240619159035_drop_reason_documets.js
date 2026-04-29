exports.up = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.dropColumn("reason");
  });

exports.down = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.string("reason");
  });
