exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.uuid("service_id");

    table
    .foreign('service_id')
    .references("id")
    .inTable('services')
    .onUpdate('CASCADE')
    .onDelete('CASCADE');
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("service_id");
  });
