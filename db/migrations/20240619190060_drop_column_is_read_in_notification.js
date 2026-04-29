exports.up = (knex) =>
  knex.schema.alterTable("notification", (table) => {
    table.dropColumn("is_read");
  });

exports.down = (knex) =>
  knex.schema.alterTable("notification", (table) => {
    table.string("is_read");
  });
