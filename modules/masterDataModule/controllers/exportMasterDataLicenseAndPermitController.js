const { Readable } = require("stream");
const { Parser } = require("json2csv");
const {
  getAllLicenseAndPermit,
} = require("../services/getAllLicenseAndPermit");
const logger = require("@lib/logger");
const { fetchServices } = require("../services/service");
const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const appConstants = require("../../../constant/appConstants");
const { toSentenceCase } = require("../../../lib/helper");
const { exportMasterData } = require("../dbServices/addOneLicenseAndPermitDbServices");

const exportMasterDataLicenseAndPermitController = async (req, res) => {
  try {
    const serviceNames = [
      appConstants.SERVICES.LIQUOR,
      appConstants.SERVICES.ADVERTISEMENT,
      appConstants.SERVICES.LAND_AND_PROPERTIES,
    ];

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

    const data = await getAllLicenseAndPermit(
      req.query,
      [
        "category.name as category",
        "sub_category.name as subCategory",
        "permit_master_data.amount",
        "permit_master_data.public_participation as publicParticipation",
        "permit_master_data.application_fee as applicationFee",
        "permit_master_data.board_approval as boardApproval",
        "permit_master_data.permit_fee as permitFee",
        "services.name",
      ],
      req.user.county_id,
      null,
      null,
      null,
      whereInCondition
    );

    if (!data || data?.data?.length === 0) {
      throw new Error("No data found to export");
    }

    if (data && data?.data?.length > 0) {
      const json2csvParser = new Parser();
      const csvData = json2csvParser.parse(data?.data);

      const readable = new Readable();
      readable._read = () => {};
      readable.push(csvData);
      readable.push(null);


      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-disposition",
        "attachment; filename=license-permit-pricing.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      res.send(csvData);
    }

    res.send({
      success: true,
      message: "Data exported successfully!",
    });
  } catch (error) {
    logger.error(
      `Error in exportMasterDataLicenseAndPermitController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const exportLandRentMasterDataController = async (req, res) => {
  try {
    const [service] = await fetchServices({
      name: appConstants.SERVICES.LAND_RENT_AND_RATES,
    });

    if (!service) throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);

    let licenseDetails = await getAllLicenseAndPermit(
      req.query,
      [
        "category.name as category",
        "sub_category.name as sub_category",
        "permit_master_data.amount_payment_type as amount_payment_type",
        "permit_master_data.is_certificate_apply as does_clearance_certificate_apply",
        "services.name as service_name",
        "permit_master_data.is_partial_payment_allowed",
      ],
      req.user.county_id,
      service.id
    );

    licenseDetails.data = licenseDetails.data.map((item) => {
      return {
        ...item,
        category: toSentenceCase(item.category),
        sub_category: toSentenceCase(item.sub_category),
        amount_payment_type: toSentenceCase(item.amount_payment_type),
        service_name: toSentenceCase(item.service_name),
      };
    });

    if (!licenseDetails || licenseDetails?.data?.length === 0) {
      throw new Error("No data found to export");
    }

    if (licenseDetails && licenseDetails?.data?.length > 0) {
      const json2csvParser = new Parser();
      const csvData = json2csvParser.parse(licenseDetails?.data);

      const readable = new Readable();
      readable._read = () => {};
      readable.push(csvData);
      readable.push(null);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Land_Rent_and_Rates_master_data.csv"
      );
      res.setHeader("Content-Type", "text/csv");

      return res.send(csvData);
    }

    res.send({
      success: true,
      message: "Data exported successfully!",
    });
  } catch (error) {
    logger.error(
      `Error in exportLandRentMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const exportPublicHealthMasterDataController = async (req, res) => {
  try {
    const serviceNames = [
      appConstants.SERVICES.MEDICAL_CERTIFICATE,
      appConstants.SERVICES.FOOD_HYGIENE,
      appConstants.SERVICES.OCCUPATIONAL_CERTIFICATE,
    ];
    const masterData = await exportMasterData(req, res, serviceNames, 'Public_Health');

    if (masterData?.length) {
      res.send(masterData);
    }

    res.send({
      success: true,
      message: "Data exported successfully.",
    });
  } catch (error) {
    logger.error(
      `Error in exportPublicHealthMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const exportBuildingApprovalMasterDataController = async (req, res) => {
  try {
    const serviceNames = [appConstants.SERVICES.BUILDING_APPROVAL];
    const masterData = await exportMasterData(req, res, serviceNames, 'Building_Approval');

    if (masterData?.length) {
      res.send(masterData);
    }

    res.send({
      success: true,
      message: "Data exported successfully.",
    });
  } catch (error) {
    logger.error(
      `Error in exportBuildingApprovalMasterDataController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

module.exports = {
  exportMasterDataLicenseAndPermitController,
  exportLandRentMasterDataController,
  exportPublicHealthMasterDataController,
  exportBuildingApprovalMasterDataController
};
