const { Parser } = require("json2csv");
const { Readable } = require("stream");

const logger = require("../../../lib/logger");
const knex = require("../../../lib/knex");
const { errorConstants } = require("../../../constant/errorConstants");
const { fetchServices } = require("../services/service");
const { getAllLicenseAndPermit } = require("../services/getAllLicenseAndPermit");
const { toSentenceCase } = require("../../../lib/helper");
const getActiveMasterDataLicenseAndPermit = require("../services/licenseAndPermitServices");

const addOneLicenseAndPermit = async (body, transaction) => {
  try {
    if(!body?.amount) body.amount = 0;
    if (transaction) {
      return await transaction("permit_master_data")
        .insert(body)
        .returning("id");
    } else return await knex("permit_master_data").insert(body).returning("id");
  } catch (error) {
    await transaction.rollback();
    logger.error(
      "Error while adding license and permit:addOneLicenseAndPermitDbServices",
      error
    );
    throw new Error(errorConstants.FAILED_ADD_MASTER_DATA);
  }
};

const exportMasterData = async (req, res, serviceNames = [], module_name) => {
  try {
    const services = await fetchServices((builder) =>
      builder.whereIn("name", serviceNames)
    );

    let whereInCondition;
    if (services && services.length > 0) {
      whereInCondition = {
        column: "permit_master_data.service_id",
        values: services.map((service) => service.id),
      };
    }

    let publicHealthDetails = await getAllLicenseAndPermit(
      req.query,
      [
        "category.name as category",
        "sub_category.name as sub_category",
        "permit_master_data.amount_payment_type as payment_frequency",
        "services.name as service_name",
        "permit_master_data.board_approval as is_board_approval",
        "permit_master_data.public_participation as is_public_participation",
        "permit_master_data.permit_fee",
        "permit_master_data.amount as application_fee",
        "permit_master_data.application_fee as is_application_fee",
      ],
      req.user.county_id,
      null,
      null,
      null,
      whereInCondition
    );

    publicHealthDetails.data = publicHealthDetails.data.map((item) => {
      return {
        ...item,
        category: toSentenceCase(item.category),
        sub_category: toSentenceCase(item.sub_category),
        payment_frequency: toSentenceCase(item.payment_frequency),
        service_name: toSentenceCase(item.service_name),
      };
    });

    if (!publicHealthDetails || publicHealthDetails?.data?.length === 0) {
      throw new Error("No data found to export");
    }

    if (publicHealthDetails && publicHealthDetails?.data?.length > 0) {
      const json2csvParser = new Parser();
      const csvData = json2csvParser.parse(publicHealthDetails?.data);

      const readable = new Readable();
      readable._read = () => {};
      readable.push(csvData);
      readable.push(null);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${module_name}_master_data.csv`
      );
      res.setHeader("Content-Type", "text/csv");

      return csvData;
    }

    return [];
  } catch (error) {
    logger.error(`Error in exportMasterData: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const masterDataList = async (req, serviceNames) => {
  try {
    const services = await fetchServices((builder) =>
      builder.whereIn("name", serviceNames)
    );

    let whereInCondition;
    if (services && services.length > 0) {
      whereInCondition = {
        column: "permit_master_data.service_id",
        values: services.map((service) => service.id),
      };
    }

    const masterData = await getActiveMasterDataLicenseAndPermit(
      req.query,
      [
        "permit_master_data.id",
        "permit_master_data.amount_payment_type as amountPaymentType",
        "permit_master_data.category_id as categoryId",
        "category.name as category",
        "permit_master_data.sub_category_id as subCategoryId",
        "sub_category.name as subCategory",
        "permit_master_data.service_id as serviceId",
        "services.name as serviceName",
        knex.raw("COUNT(*) OVER() as totalRecords"),
        "permit_master_data.board_approval as boardApproval",
        "permit_master_data.public_participation as publicParticipation",
        "permit_master_data.application_fee as isApplicationFee",
        "permit_master_data.amount as applicationFee",
        "permit_master_data.permit_fee as permitFee",
      ],

      req.user.county_id,
      null,
      null,
      null,
      whereInCondition
    );

    masterData.data.forEach((item) => {
      item.amountPaymentType = toSentenceCase(item.amountPaymentType);
      item.serviceName = toSentenceCase(item.serviceName);
      item.category = toSentenceCase(item.category);
      item.subCategory = toSentenceCase(item.subCategory);
    });

    return masterData;
  } catch (error) {
    logger.error(`Error in masterDataList: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = { addOneLicenseAndPermit, exportMasterData, masterDataList };
