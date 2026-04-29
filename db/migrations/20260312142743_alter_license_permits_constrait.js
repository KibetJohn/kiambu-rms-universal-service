exports.up = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE license_permits
    DROP CONSTRAINT IF EXISTS license_permits_permit_payment_status_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE license_permits
    ADD CONSTRAINT license_permits_permit_payment_status_check
    CHECK (permit_payment_status IN ('PAID','NOT_PAID','FAIL','PENDING','CANCELLED'));
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE license_permits
    DROP CONSTRAINT IF EXISTS license_permits_permit_payment_status_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE license_permits
    ADD CONSTRAINT license_permits_permit_payment_status_check
    CHECK (permit_payment_status IN ('PAID','NOT_PAID','FAIL','PENDING'));
  `);
};