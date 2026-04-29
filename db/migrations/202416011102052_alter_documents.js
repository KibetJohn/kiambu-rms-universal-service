exports.up = function(knex) {
  return knex.schema.table('documents', function(table) {
    table.dropForeign('permit_id', 'documents_permit_id_foreign');
  });
};

exports.down = function(knex) {
  return knex.schema.table('documents', function(table) {
    table.foreign('permit_id').references('license_permits.id');
  });
};
