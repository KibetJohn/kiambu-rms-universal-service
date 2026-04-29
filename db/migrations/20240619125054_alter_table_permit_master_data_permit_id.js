exports.up = function(knex) {
  return knex.schema.table('license_permits', function(table) {
    table.renameColumn('master_data_license_permits_id', 'permit_master_id');
  })
  .then(function() {
    return knex.schema.alterTable('license_permits', function(table) {
      table.uuid('permit_master_id').alter();
    });
  })
  .then(function() {
    return knex.schema.alterTable('license_permits', function(table) {
      table.foreign('permit_master_id')
           .references('id')
           .inTable('permit_master_data')
           .onDelete('CASCADE');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('license_permits', function(table) {
    table.dropForeign('permit_master_id');
  })
  .then(function() {
    return knex.schema.alterTable('license_permits', function(table) {
      table.integer('permit_master_id').alter();
    });
  })
  .then(function() {
    return knex.schema.table('license_permits', function(table) {
      table.renameColumn('permit_master_id', 'master_data_license_permits_id');
    });
  });
};
