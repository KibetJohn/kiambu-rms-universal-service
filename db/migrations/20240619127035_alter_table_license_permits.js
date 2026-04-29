const { enums } = require("../../constant/enumConstants");

exports.up = async (knex) => {
  await knex.schema.alterTable("license_permits", (table) => {
    table.string("stream", 255);
    table.string("description", 255);
    table
      .uuid("uploaded_documents_id")
      .references("id")
      .inTable("documents")
      .onDelete("CASCADE");
    table.uuid("created_by").alter();
    table.string("location");
    table.string("email");
    table.string("phone_number");
    table.enu("application_status", enums.APPLICATION_STATUS);
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("license_permits", (table) => {
    table.dropForeign("uploaded_documents_id");
    table.dropColumn("stream");
    table.dropColumn("description");
    table.dropColumn("uploaded_documents_id");
    table.string("created_by").alter();
    table.dropColumn("location");
    table.dropColumn("email");
    table.dropColumn("phone_number");
    table.dropColumn("application_status");
  });
};
