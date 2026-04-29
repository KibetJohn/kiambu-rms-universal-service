const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('universal_master_data_license_permits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('category', 255).notNullable();
    table.string('sub_category', 255).notNullable();
    table.float('amount').notNullable();
    table.uuid('county_id');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

  }).then(()=> knex.raw(onUpdateTrigger('universal_master_data_license_permits')));

exports.down = (knex) => knex.schema.dropTableIfExists('universal_master_data_license_permits');
