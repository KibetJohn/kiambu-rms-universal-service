const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('user_notification', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id');
    table.uuid('notification_id');
    table.boolean('is_rejected').defaultTo(false);
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

    table
    .foreign('notification_id')
    .references('notification.id')
    .onUpdate('CASCADE')
    .onDelete('CASCADE');

  }).then(()=> knex.raw(onUpdateTrigger('user_notification')));

exports.down = (knex) => knex.schema.dropTableIfExists('user_notification');
