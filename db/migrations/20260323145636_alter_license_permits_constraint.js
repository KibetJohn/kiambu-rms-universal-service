exports.up = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE license_permits
    DROP CONSTRAINT IF EXISTS license_permits_application_status_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE license_permits
    ADD CONSTRAINT license_permits_application_status_check
    CHECK (application_status = ANY (ARRAY['DRAFT', 'SUBMITTED', 'REJECTED', 'IN-PROCESS', 'PENDING', 'APPROVED']));
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE license_permits
    DROP CONSTRAINT IF EXISTS license_permits_application_status_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE license_permits
    ADD CONSTRAINT license_permits_application_status_check
    CHECK (application_status = ANY (ARRAY['SUBMITTED', 'REJECTED', 'IN-PROCESS', 'PENDING', 'APPROVED']));
  `);
};