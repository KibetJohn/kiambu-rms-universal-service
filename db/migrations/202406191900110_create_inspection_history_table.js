const { onUpdateTrigger } = require("../../startup/ConnectDB");

exports.up = (knex) => 
  knex.schema.createTable('inspection_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.uuid('permit_id').notNullable();
    table.string('status').notNullable().defaultTo('PENDING');
    table.string("comments");
    table.string("recommendation");
    table.string("location");
    table.date("next_visit");
    table.boolean('compliance').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

    table
    .foreign('permit_id')
    .references('license_permits.id')
    .onUpdate('CASCADE')
    .onDelete('CASCADE');

    knex.raw(`ALTER TABLE "inspection_history" ADD CONSTRAINT "inspection_status_check" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'))`);
    
  }).then(()=> knex.raw(onUpdateTrigger('inspection_history')));

exports.down = (knex) => knex.schema.dropTableIfExists('inspection_history');
