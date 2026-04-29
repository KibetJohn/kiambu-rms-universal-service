exports.up = async (knex) => {
  await knex.schema.alterTable("license_permits", (table) => {
    table.boolean("application_for_staff");
  });  
};

exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("application_for_staff");
  });
