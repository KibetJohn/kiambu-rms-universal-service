exports.up = function(knex) {
  return knex.schema.alterTable('license_permits', () => {
    // Drop the existing check constraint
    return knex.raw('ALTER TABLE license_permits DROP CONSTRAINT IF EXISTS license_permits_permit_status_check')
      .then(() => {
        // Add the updated check constraint with the new "IN_ACTIVE" status
        return knex.raw(`
          ALTER TABLE license_permits
          ADD CONSTRAINT license_permits_permit_status_check
          CHECK (permit_status IN ('ACTIVE', 'PENDING', 'IN_ACTIVE', 'EXPIRED'))
        `);
      });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('license_permits', () => {
    // Drop the updated check constraint
    return knex.raw('ALTER TABLE license_permits DROP CONSTRAINT IF EXISTS license_permits_permit_status_check')
      .then(() => {
        // Re-add the original check constraint without "IN_ACTIVE"
        return knex.raw(`
          ALTER TABLE license_permits
          ADD CONSTRAINT license_permits_permit_status_check
          CHECK (permit_status IN ('ACTIVE', 'PENDING', 'EXPIRED'))
        `);
      });
  });
};
