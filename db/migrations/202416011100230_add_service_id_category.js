exports.up = (knex) =>
  knex.schema.alterTable("category", (table) => {
    table
      .uuid("service_id")
      .references("id")
      .inTable("services")
      .onDelete("CASCADE");
  });

exports.down = (knex) =>
  knex.schema.alterTable("category", (table) => {
    table.dropColumn("service_id");
  });
