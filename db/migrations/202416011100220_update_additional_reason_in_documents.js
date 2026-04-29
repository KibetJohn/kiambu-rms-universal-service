exports.up = async (knex) => {
  // Transform data to ensure compatibility
  await knex.raw(`
    ALTER TABLE documents
    ALTER COLUMN additional_reason TYPE jsonb
    USING CASE
      WHEN additional_reason IS NULL THEN '{}'::jsonb
      WHEN additional_reason = '' THEN '{}'::jsonb
      WHEN additional_reason ~ '^[\\[{]' THEN additional_reason::jsonb
      ELSE ('{"reason": "' || additional_reason || '"}')::jsonb
    END;
  `);
};

exports.down = async (knex) => {
  // Revert column back to string type
  await knex.raw(`
    ALTER TABLE documents
    ALTER COLUMN additional_reason TYPE text
    USING additional_reason::text;
  `);
};
