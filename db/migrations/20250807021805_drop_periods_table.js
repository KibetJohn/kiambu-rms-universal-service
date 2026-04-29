exports.up = async function (knex) {
  await knex('knex_migrations')
    .whereIn('name', [
      '24072025125731_create_license_periods.js',
    ])
    .del();
};

exports.down = function () {
  return Promise.resolve();
};
