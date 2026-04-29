exports.up = (knex) =>
  knex.schema.alterTable("license_permits", function (table) {
    table.text("description").alter();
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", function (table) {
    table.string("description", 255).alter();
  });
