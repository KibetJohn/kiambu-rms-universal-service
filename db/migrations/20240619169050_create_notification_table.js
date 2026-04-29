const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('notification', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('message', 255).notNullable();
    table.uuid('county_id').notNullable();
    table.uuid('permit_id').notNullable();
    table.uuid('assigned_by').notNullable();
    table.uuid('notify_user_id');  // if needs to notify a specific user else keep null to notify all
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

  }).then(()=> knex.raw(onUpdateTrigger('notification')));

exports.down = (knex) => knex.schema.dropTableIfExists('notification');
