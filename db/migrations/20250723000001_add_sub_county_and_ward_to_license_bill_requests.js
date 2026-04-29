exports.up = async (knex) => {
  await knex.schema.alterTable("license_bill_requests", (table) => {
    table.string("sub_county");
    table.string("ward");
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("license_bill_requests", (table) => {
    table.dropColumn("sub_county");
    table.dropColumn("ward");
  });
};