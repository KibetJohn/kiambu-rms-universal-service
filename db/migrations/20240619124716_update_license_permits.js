const { enums } = require("../../constant/enumConstants");
const appConstants = require("../../constant/appConstants");

exports.up = async (knex) => {
  await knex.schema.alterTable("license_permits", (table) => {
    table.uuid("payment_id");
    table.float("amount");
    table
      .enu("permit_status", enums.PERMIT_STATUS_ENUM)
      .defaultTo(appConstants.PERMIT_STATUS.PENDING)
      .notNullable();
    table.string("reference_number");
    table.string("created_by");
  });

  await knex.raw(`
      CREATE OR REPLACE FUNCTION update_reference_number()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.reference_number := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

  await knex.raw(`
      CREATE TRIGGER update_reference_number_trigger
      BEFORE INSERT ON license_permits
      FOR EACH ROW
      EXECUTE FUNCTION update_reference_number();
    `);
};
exports.down = (knex) =>
  knex.schema.alterTable("license_permits", (table) => {
    table.dropColumn("amount");
    table.dropColumn("payment_id");
    table.dropColumn("permit_status");
    table.dropColumn("reference_number");
    table.dropColumn("created_by");
  });
