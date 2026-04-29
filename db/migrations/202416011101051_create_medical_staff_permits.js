const appConstants = require("../../constant/appConstants");
const { enums } = require("../../constant/enumConstants");

exports.up = (knex) =>
  knex.schema.createTable("medical_staff_permits", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .enu("permit_status", enums.PERMIT_STATUS_ENUM)
      .defaultTo(appConstants.PERMIT_STATUS.PENDING)
      .notNullable();
    table.string("reference_number");
    table
      .uuid("permit_master_id")
      .references("id")
      .inTable("permit_master_data")
      .onDelete("CASCADE");
    table.string("amount");
    table.string("document_number", 255);
    table.string("staff_name", 255);
    table.string("email", 255);
    table.string("phone_number", 20);
    table.uuid("uploaded_documents_id");
    table.string("location", 255);
    table.text("description");
    table
      .uuid("permit_id")
      .references("id")
      .inTable("license_permits")
      .onDelete("CASCADE");
    table.uuid("permit_payment_id");
    table.string("permit_payment_status", 50);
    table.uuid("application_id");
    table.string("application_status", 50);
    table.uuid("created_by").notNullable();
    table.timestamp("valid_till");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at");
  });

exports.down = (knex) => {
  knex.schema.dropTableIfExists("medical_staff_permits");
};
