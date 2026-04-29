exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.uuid("business_id").nullable();
    table.uuid("branch_id").nullable();
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("business_id");
    table.dropColumn("branch_id");
  });