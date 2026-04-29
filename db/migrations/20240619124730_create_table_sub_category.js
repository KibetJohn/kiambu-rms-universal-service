const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('sub_category', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.uuid('category_id');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

    table
    .foreign('category_id')
    .references('category.id')
    .onUpdate('CASCADE')
    .onDelete('CASCADE');

  }).then(()=> knex.raw(onUpdateTrigger('sub_category')));

exports.down = (knex) => knex.schema.dropTableIfExists('sub_category');
