exports.up = function (knex) {
  return knex.schema.alterTable("permit_master_data", function (table) {
    table.string("period").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("permit_master_data", function (table) {
    table.dropColumn("period");
  });
};
