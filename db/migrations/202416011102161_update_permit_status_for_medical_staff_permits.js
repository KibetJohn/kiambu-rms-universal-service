const { enums } = require("../../constant/enumConstants");

exports.up = async function (knex) {
  // Drop the existing CHECK constraint if it exists
  await knex.raw(`
    DO $$ 
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'medical_staff_permits' 
                 AND constraint_name = 'medical_staff_permits_permit_status_check') THEN
        ALTER TABLE medical_staff_permits DROP CONSTRAINT medical_staff_permits_permit_status_check;
      END IF;
    END $$;
  `);

  // Add the new CHECK constraint with updated ENUM values
  await knex.raw(`
    ALTER TABLE medical_staff_permits 
    ADD CONSTRAINT medical_staff_permits_permit_status_check 
    CHECK (permit_status IN (${enums.NEW_PERMIT_STATUS_ENUM.map(status => `'${status}'`).join(', ')}));
  `);
};

exports.down = async function (knex) {
  // Drop the new CHECK constraint if it exists
  await knex.raw(`
    DO $$ 
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'medical_staff_permits' 
                 AND constraint_name = 'medical_staff_permits_permit_status_check') THEN
        ALTER TABLE medical_staff_permits DROP CONSTRAINT medical_staff_permits_permit_status_check;
      END IF;
    END $$;
  `);

  // Re-add the old CHECK constraint with previous ENUM values
  await knex.raw(`
    ALTER TABLE medical_staff_permits 
    ADD CONSTRAINT medical_staff_permits_permit_status_check 
    CHECK (permit_status IN (${enums.PERMIT_STATUS_ENUM.map(status => `'${status}'`).join(', ')}));
  `);
};
