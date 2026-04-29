exports.up = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.string("business_name");
    table.string("business_registration_no");
  });

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("business_name");
    table.dropColumn("business_registration_no");
  });
