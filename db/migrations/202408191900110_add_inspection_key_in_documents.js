exports.up = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.boolean("inspection_documents").defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.dropColumn("inspection_documents");
  });
