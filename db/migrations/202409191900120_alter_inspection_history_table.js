exports.up = (knex) =>
  knex.schema.alterTable('inspection_history', (table) => {
    table.boolean('compliance').nullable().alter();
  });

exports.down = (knex) =>
  knex.schema.alterTable('inspection_history', (table) => {
    table.boolean('compliance').notNullable().alter();
  });
