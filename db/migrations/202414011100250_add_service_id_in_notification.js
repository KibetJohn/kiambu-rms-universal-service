exports.up = (knex) =>
  knex.schema.alterTable("notification", (table) => {
    table.string("service_id");
  });

exports.down = (knex) =>
  knex.schema.alterTable("notification", (table) => {
    table.dropColumn("service_id");
  });
