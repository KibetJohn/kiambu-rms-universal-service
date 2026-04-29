exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.string("plot_number");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("plot_number");
  });
