const { enums } = require("../../constant/enumConstants");

exports.up = async (knex) => {
  await knex.raw(`
    ALTER TABLE license_permits 
    DROP CONSTRAINT IF EXISTS license_permits_application_status_check;
  `);

  await knex.raw(`
    ALTER TABLE license_permits 
    ADD CONSTRAINT license_permits_application_status_check 
    CHECK (application_status IN (${enums.NEW_APPLICATION_STATUS.map(status => `'${status}'`).join(", ")}));
  `);
};

exports.down = async (knex) => {
  await knex.raw(`
    ALTER TABLE license_permits 
    DROP CONSTRAINT IF EXISTS license_permits_application_status_check;
  `);

  await knex.raw(`
    ALTER TABLE license_permits 
    ADD CONSTRAINT license_permits_application_status_check 
    CHECK (application_status IN (${enums.APPLICATION_STATUS.map(status => `'${status}'`).join(", ")}));
  `);
};
