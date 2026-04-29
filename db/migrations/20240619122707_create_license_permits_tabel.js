const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('license_permits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.string('master_data_license_permits_id' ).notNullable();
    table.uuid('county_id' ).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('valid_till');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
  }).then(()=> knex.raw(onUpdateTrigger('license_permits')));

exports.down = (knex) => knex.schema.dropTableIfExists('license_permits');
