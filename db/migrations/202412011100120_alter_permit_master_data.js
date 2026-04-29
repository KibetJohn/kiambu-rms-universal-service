exports.up = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table
      .uuid("service_id")
      .references("id")
      .inTable("services")
      .onDelete("CASCADE");
  });

exports.down = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.dropColumn("service_id");
  });
