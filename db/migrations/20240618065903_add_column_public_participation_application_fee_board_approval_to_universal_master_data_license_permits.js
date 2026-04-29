exports.up = (knex) =>
    knex.schema.table('universal_master_data_license_permits', (table) => {
        table.boolean('public_participation').defaultTo(false),
        table.boolean('application_fee').defaultTo(false),
        table.boolean('board_approval').defaultTo(false),
        table.timestamp('valid_till');
    });

exports.down = (knex) =>
    knex.schema.table('universal_master_data_license_permits', (table) => {
        table.boolean('public_participation'),
        table.boolean('application_fee'),
        table.boolean('board_approval'),
        table.timestamp('valid_till');
});