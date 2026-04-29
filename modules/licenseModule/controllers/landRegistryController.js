const logger = require("@lib/logger");
const {
  landParcelApplicationService,
  landParcelSearchService,
  landParcelListService,
  landSubdivisionApplicationService,
  landUseChangeApplicationService,
  allLandParcelsService,
  landParcelCountService,
} = require("../services/landRegistryService");
const { calculateLandRateService } = require("../services/calculateLandRates");

const landParcelApplicationController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Parcel Saved Successfully!",
      data: await landParcelApplicationService(req),
    });
  } catch (error) {
    logger.error(`Error in landParcelApplicationController: ${error?.message}`, { error });
    throw error;
  }
};

const landParcelSearchController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Parcels Fetched Successfully!",
      data: await landParcelSearchService(req),
    });
  } catch (error) {
    logger.error(`Error in landParcelSearchController: ${error?.message}`, { error });
    throw error;
  }
};

const getLandParcelListController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Parcels Fetched Successfully!",
      data: await landParcelListService(req),
    });
  } catch (error) {
    logger.error(`Error in getLandParcelListController: ${error?.message}`, { error });
    throw error;
  }
};

const landSubdivisionApplicationController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Subdivision Application Submitted Successfully!",
      data: await landSubdivisionApplicationService(req),
    });
  } catch (error) {
    logger.error(`Error in landSubdivisionApplicationController: ${error?.message}`, { error });
    throw error;
  }
};

const landUseChangeApplicationController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Use Change Application Submitted Successfully!",
      data: await landUseChangeApplicationService(req),
    });
  } catch (error) {
    logger.error(`Error in landUseChangeApplicationController: ${error?.message}`, { error });
    throw error;
  }
};

const getAllLandParcelsController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Parcels Fetched Successfully!",
      data: await allLandParcelsService(req),
    });
  } catch (error) {
    logger.error(`Error in getAllLandParcelsController: ${error?.message}`, { error });
    throw error;
  }
};

const getLandParcelCountController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Parcel Count Fetched Successfully!",
      data: await landParcelCountService(req),
    });
  } catch (error) {
    logger.error(`Error in getLandParcelCountController: ${error?.message}`, { error });
    throw error;
  }
};

const getLandParcelDataController = async (req, res) => {
  try {
    const data = await calculateLandRateService(req);
    res.send({
      message: "Parcel data fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(`Error in getLandParcelDataController: ${error?.message}`, { error });
    throw error;
  }
};

module.exports = {
  landParcelApplicationController,
  landParcelSearchController,
  getLandParcelListController,
  landSubdivisionApplicationController,
  landUseChangeApplicationController,
  getAllLandParcelsController,
  getLandParcelCountController,
  getLandParcelDataController,
};