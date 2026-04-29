exports.up = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.string("amount_payment_type");
    table.boolean("is_certificate_apply").defaultTo(false);
    table.boolean("is_partial_payment_allowed").defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable("permit_master_data", (table) => {
    table.dropColumn("amount_payment_type");
    table.dropColumn("is_certificate_apply");
    table.dropColumn("is_partial_payment_allowed");
  });
