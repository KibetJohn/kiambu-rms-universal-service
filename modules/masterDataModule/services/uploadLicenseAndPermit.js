const Ajv = require("ajv");
const csv = require("csv-parser");
const addFormats = require("ajv-formats");
const fse = require("fs-extra");
const logger = require("../../../lib/logger");
const knex = require("../../../lib/knex");
const {
  addOneLicenseAndPermit,
} = require("../dbServices/addOneLicenseAndPermitDbServices");
const {
  checkCategoryAndSubCategoryUnique,
  findOneServiceData,
} = require("../dbServices/licenseAndPermitsDbServices");
const {
  convertKeysToSnakeCase,
  toSentenceCase,
} = require("../../../lib/helper");
const promisify = require("../../../lib/async");
const { sendNotification } = require("../../../lib/rabbitMq");
const appConstants = require("../../../constant/appConstants");
const addErrors = require("ajv-errors");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
addErrors(ajv);

const commonService = [
  appConstants.SERVICES.MEDICAL_CERTIFICATE,
  appConstants.SERVICES.FOOD_HYGIENE,
  appConstants.SERVICES.OCCUPATIONAL_CERTIFICATE,
  appConstants.SERVICES.BUILDING_APPROVAL,
];

const uploadLicenseAndPermit = async (req, validateSchema) => {
  return await new Promise((resolve, reject) => {
    try {
      let allRows = [];
      const countyId = req.user.county_id;
      const csvErrors = [];

      const stream = fse.createReadStream(req.file.path).pipe(csv({}));
      stream.on("error", (err) => {
        logger.log("error", err);
        reject(err);
      });
      const validator = ajv.compile(validateSchema);

      stream.on("data", function (csvrow) {
        if (validateCsvRow(csvrow, csvErrors, validator)) {
          csvrow["countyId"] = countyId;
          csvrow.category = csvrow.category.toLowerCase();
          csvrow.subCategory = csvrow.subCategory.toLowerCase();
          csvrow.service = csvrow.service.toUpperCase();
          allRows.push(csvrow);
        }
      });
      stream.on("end", async function () {
        fse.unlink(req.file.path);
        if (allRows.length > 0) {
          await uploadData(allRows, req);
        }
        resolve(csvErrors);
      });
    } catch (error) {
      logger.error(
        `Error in uploadLicenseAndPermit controller: ${error?.message}`,
        {
          error,
        }
      );
      reject(error);
    }
  });
};

const validateCsvRow = (row, csvErrors, validator) => {
  if (validator(row)) {
    return true;
  } else {
    row.error =
      toSentenceCase(validator.errors[0].instancePath) +
      " " +
      validator.errors[0].message;
    csvErrors.push(row);

    logger.log(
      "error in validatind csv row ",
      validator.errors[0].message,
      validator.errors
    );
    return false;
  }
};

const uploadData = async (rows, req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    rows = convertKeysToSnakeCase(rows);
    for (const row of rows) {
      try {
        const [serviceData] = await findOneServiceData({ name: row.service });
        row.service_id = serviceData?.id;
        const licenseAndPermit = await checkCategoryAndSubCategoryUnique(
          row,
          transaction
        );
        row.category_id = licenseAndPermit?.categoryId;
        row.sub_category_id = licenseAndPermit?.subCategoryId;
        delete row.category;
        delete row.sub_category;
        if (commonService.includes(row.service)) {
          row.amount_payment_type = row.payment_frequency;
          row.board_approval = row.is_board_approval;
          row.public_participation = row.is_public_participation;
          row.amount = row.application_fee;
          row.application_fee = row.is_application_fee;
          delete row.payment_frequency;
          delete row.is_board_approval;
          delete row.is_public_participation;
          delete row.is_application_fee;
        }
        delete row.service;
        const [licenseData] = await addOneLicenseAndPermit(row, transaction);

        const action =
          serviceData?.name === appConstants.SERVICES.BUILDING_APPROVAL
            ? appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT
            : appConstants.AUDIT_CONSTANTS.PUBLIC_HEALTH;

        sendNotification(
          JSON.stringify({
            user_id: req.user.id,
            user_name: `${req.user.first_name} ${req.user.last_name}`,
            action,
            action_details: `Master data Added.`,
            role: req.user.type,
            event_type: "CREATED",
            device_id: req.user.device_id || null,
            device_type: "WEB",
            elk_ref_id: req.elk_reference_id || "",
            action_performed_on: licenseData,
            service: serviceData?.name,
            county_id: req.user.id,
          }),
          appConstants.QUEUE.PDSL_AUDIT_QUEUE
        );
      } catch (error) {
        console.error(
          `Error processing row with categoryId: ${row.category_id} and subCategoryId: ${row.sub_category_id}. Error: ${error.message}`
        );
        continue;
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    logger.log("error in upload data", error);
  }
};

const findOneLicenseAndPermit = async (body, select = ["*"], join = false) => {
  const query = knex("permit_master_data").select(select).where(body);

  if (join) {
    query.leftJoin("category", "category.id", "permit_master_data.category_id");
  }
  const [licenseAndPermit] = await query;
  return licenseAndPermit;
};

module.exports = {
  uploadLicenseAndPermit,
  findOneLicenseAndPermit,
};
