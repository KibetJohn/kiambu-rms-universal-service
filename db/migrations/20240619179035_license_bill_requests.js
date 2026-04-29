exports.up = async (knex) => {
  await knex.schema.createTable("license_bill_requests", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("bill_type").notNullable();
    table.integer("bill_amount").notNullable();
    table.string("bill_reference").notNullable();
    table
      .uuid("permit_id")
      .references("id")
      .inTable("license_permits")
      .onDelete("CASCADE");
    table.uuid("payment_id");
    table.uuid("county_id");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at");
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_bill_reference()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.bill_reference := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

await knex.raw(`
    CREATE TRIGGER update_bill_reference_trigger
    BEFORE INSERT ON license_bill_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_bill_reference();
  `);
};

exports.down = async (knex) => {
  await knex.raw(
    `DROP TRIGGER IF EXISTS update_bill_reference_trigger ON license_bill_requests`
  );
  await knex.raw(`DROP FUNCTION IF EXISTS update_bill_reference`);
  await knex.schema.dropTableIfExists("license_bill_requests");
};
