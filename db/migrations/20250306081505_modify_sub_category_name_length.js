
exports.up = function (knex) {
    return knex.schema.alterTable('sub_category', (table) => {
        table.string('name', 1000).notNullable().alter();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('sub_category', (table) => {
        table.string('name', 255).notNullable().alter();
    });
};
