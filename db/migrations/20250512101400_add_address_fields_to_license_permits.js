exports.up = function (knex) {
    return knex.schema.alterTable("license_permits", function (table) {
      table.string("street");
      table.string("floor_number");
      table.string("stall_number");
      table.string("building_name");
      table.string("po_box");
      table.string("postal_code");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.alterTable("license_permits", function (table) {
      table.dropColumn("street");
      table.dropColumn("floor_number");
      table.dropColumn("stall_number");
      table.dropColumn("building_name");
      table.dropColumn("po_box");
      table.dropColumn("postal_code");
    });
  };
  