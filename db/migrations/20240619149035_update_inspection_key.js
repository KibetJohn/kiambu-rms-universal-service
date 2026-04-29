exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.boolean("inspection_request").defaultTo(false);
    table.string("reason");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("inspection_request");
    table.dropColumn("reason");
  });
