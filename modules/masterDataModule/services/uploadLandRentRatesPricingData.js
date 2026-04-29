const Ajv = require("ajv");
const csv = require("csv-parser");
const addFormats = require("ajv-formats");
const fse = require("fs-extra");
const logger = require("../../../lib/logger");
const knex = require("../../../lib/knex");
const promisify = require("../../../lib/async");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const uploadLandRentRatesPricingData = async (req, validateSchema) => {
  return await new Promise((resolve, reject) => {
    try {
      const csvErrors = [];
      const allRows = [];
      const validator = ajv.compile(validateSchema);

      const stream = fse.createReadStream(req.file.path).pipe(csv({}));

      stream.on("error", (err) => {
        logger.error("Stream error in uploadLandRentRatesPricingData", { err });
        reject(err);
      });

      stream.on("data", (row) => {
        if (validator(row)) {
          allRows.push(row);
        } else {
          row.error = validator.errors[0].message;
          csvErrors.push(row);
          logger.error("CSV row validation failed", {
            errors: validator.errors,
            row,
          });
        }
      });

      stream.on("end", async () => {
        fse.unlink(req.file.path);
        if (allRows.length > 0) {
          const uploadErrors = await uploadData(allRows);
          csvErrors.push(...uploadErrors);
        }
        resolve(csvErrors);
      });
    } catch (error) {
      logger.error(
        `Error in uploadLandRentRatesPricingData: ${error?.message}`,
        { error }
      );
      reject(error);
    }
  });
};

const uploadData = async (rows) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  const rowErrors = [];

  try {
    for (const row of rows) {
      try {
        const landUse = await knex("land_use_types")
          .whereRaw("LOWER(TRIM(name)) = ?", [row.Land_Use_Name.trim().toLowerCase()])
          .where({ status: true })
          .first();
        if (!landUse) {
          row.error = `Land use type not found for name: ${row.Land_Use_Name}`;
          rowErrors.push(row);
          continue;
        }

        const path = await knex("path_codes")
          .whereRaw("UPPER(TRIM(code)) = ?", [row.Path_Code.trim().toUpperCase()])
          .where({ is_active: true })
          .first();
        if (!path) {
          row.error = `Path not found for code: ${row.Path_Code}`;
          rowErrors.push(row);
          continue;
        }

        const zone = await knex("land_zones")
          .whereRaw("UPPER(TRIM(code)) = ?", [row.Zone_Code.trim().toUpperCase()])
          .where({ is_active: true })
          .first();
        if (!zone) {
          row.error = `Zone not found for code: ${row.Zone_Code}`;
          rowErrors.push(row);
          continue;
        }

        const rateUnit = await knex("rate_units")
          .whereRaw("LOWER(TRIM(name)) = ?", [row.Rate_Unit.trim().toLowerCase()])
          .where({ is_active: true })
          .first();
        if (!rateUnit) {
          row.error = `Rate unit not found: ${row.Rate_Unit}`;
          rowErrors.push(row);
          continue;
        }

        const year = parseInt(row.Year, 10);
        const rate = parseFloat(row.Rate_Value);

        const existing = await knex("land_rate_pricing_data")
          .where({
            land_use_id: landUse.id,
            path_id: path.id,
            zone_id: zone.id,
            year,
          })
          .first();
        if (existing) {
          row.error = `Duplicate: pricing already exists for Land Use=${row.Land_Use_Name}, Path=${row.Path_Code}, Zone=${row.Zone_Code}, Year=${year}`;
          rowErrors.push(row);
          continue;
        }

        await knex("land_rate_pricing_data")
          .transacting(transaction)
          .insert({
            land_use_id: landUse.id,
            path_id: path.id,
            zone_id: zone.id,
            rate,
            year,
            rate_unit: rateUnit.name,
          });

      } catch (rowError) {
        logger.error(
          `Error processing row: ${JSON.stringify(row)}. Error: ${rowError.message}`
        );
        row.error = rowError.message;
        rowErrors.push(row);
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    logger.error("Fatal error in uploadData for land rent pricing", { error });
  }

  return rowErrors;
};

module.exports = { uploadLandRentRatesPricingData };