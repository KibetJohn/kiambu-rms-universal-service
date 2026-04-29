exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.integer("no_of_months");
    table.boolean("is_renew").defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("no_of_months");
    table.dropColumn("is_renew");
  });
