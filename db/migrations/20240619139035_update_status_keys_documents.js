exports.up = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.string("reason");
    table.boolean("reupload_document_request").defaultTo(false);
    table.boolean("additional_document_request").defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable("documents", (table) => {
    table.dropColumn("document_request");
    table.dropColumn("reason");
    table.dropColumn("reupload_document_request");
    table.dropColumn("additional_document_request");
  });
