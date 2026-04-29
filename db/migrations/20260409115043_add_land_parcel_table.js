const { enums } = require("../../constant/enumConstants");

exports.up = function (knex) {
  return knex.schema.createTable("land_parcels", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.uuid("user_id").notNullable();
    table.uuid("county_id").notNullable();
    table.uuid("service_id").notNullable();
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("other_name").nullable();
    table.string("identification_number").notNullable();
    table.string("kra_pin").notNullable();
    table.string("mobile_number").notNullable();
    table.string("email").notNullable();
    table.string("land_size").notNullable();
    table.string("land_no").notNullable();
    table.uuid("sub_county_id").notNullable();
    table.uuid("ward_id").notNullable();
    table.string("longitude").notNullable();
    table.string("latitude").notNullable();
    table.string("village").notNullable();
    table.string("land_use").notNullable();
    table.string("current_land_use").nullable();
    table.string("land_status").notNullable();
    table
      .enu("application_status", enums.NEW_APPLICATION_STATUS)
      .notNullable()
      .defaultTo("SUBMITTED");
    table
      .enu("payment_status", ["PAID", "NOT_PAID", "PENDING"])
      .notNullable()
      .defaultTo("PAID");
    table.uuid("application_id").nullable();
    table.uuid("uploaded_documents_id").nullable();
    table.uuid("created_by").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("land_parcels");
};