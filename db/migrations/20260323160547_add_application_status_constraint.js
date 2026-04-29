exports.up = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE license_permits 
    DROP CONSTRAINT application_status_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE license_permits
    ADD CONSTRAINT application_status_check 
    CHECK (application_status IN ('SUBMITTED', 'IN-PROCESS', 'APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT'));
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE license_permits 
    DROP CONSTRAINT application_status_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE license_permits 
    ADD CONSTRAINT application_status_check 
    CHECK (application_status IN ('SUBMITTED', 'IN-PROCESS', 'APPROVED', 'REJECTED', 'CANCELLED'));
  `);
};
