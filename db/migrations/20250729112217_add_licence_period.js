exports.up = function (knex) {
    return knex.schema.alterTable("license_permits", function (table) {
      table.string("period");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.alterTable("license_permits", function (table) {
      table.dropColumn("period");
    });
  };