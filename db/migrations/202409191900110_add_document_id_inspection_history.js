exports.up = (knex) =>
  knex.schema.alterTable("inspection_history", (table) => {
    table.uuid("document_id");
  });

exports.down = (knex) =>
  knex.schema.alterTable("inspection_history", (table) => {
    table.dropColumn("document_id");
  });
