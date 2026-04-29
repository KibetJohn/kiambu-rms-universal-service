const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('category', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.uuid('county_id');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

  }).then(()=> knex.raw(onUpdateTrigger('category')));

exports.down = (knex) => knex.schema.dropTableIfExists('category');
