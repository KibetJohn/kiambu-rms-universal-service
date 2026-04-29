exports.up = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.string("additional_reason");
  });

exports.down = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.drop("additional_reason");
  });
