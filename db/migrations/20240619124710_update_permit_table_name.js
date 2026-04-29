exports.up = (knex) => {
  return knex.schema.renameTable(
    "universal_master_data_license_permits",
    "permit_master_data"
  );
};

exports.down = (knex) => {
  return knex.schema.renameTable(
    "permit_master_data",
    "universal_master_data_license_permits"
  );
};
