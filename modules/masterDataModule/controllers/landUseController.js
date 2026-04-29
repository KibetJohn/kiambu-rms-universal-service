const logger = require("@lib/logger");
const {
  addMasterDataLandUseService,
  getLandUseService,
  updateLandUseService,
  searchSubcountyZoneDataService,
} = require("../services/landUseRegistryServices");
const { getLandUseTypes } = require("../services/landUseService");


const addMasterDataLandUseController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Use Type Added Successfully!",
      data: await addMasterDataLandUseService(req),
    });
  } catch (error) {
    logger.error(`Error in addMasterDataLandUseController: ${error?.message}`, { error });
    throw error;
  }
};

const getLandUseController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Use Types Fetched Successfully!",
      data: await getLandUseService(req),
    });
  } catch (error) {
    logger.error(`Error in getLandUseController: ${error?.message}`, { error });
    throw error;
  }
};

const updateLandUseController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Land Use Type Updated Successfully!",
      data: await updateLandUseService(req),
    });
  } catch (error) {
    logger.error(`Error in updateLandUseController: ${error?.message}`, { error });
    throw error;
  }
};

const landUseTypeController = async (req, res) => {
  try {
    req.query.status = req.query.status === "true";
    res.send({
      message: "Land types fetched successfully.",
      data: await getLandUseTypes(req.query),
    });
  } catch (error) {
    logger.error(`Error in landUseTypeController: ${error?.message}`, { error });
    throw error;
  }
};

const searchSubcountyZoneDataController = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    const data = await searchSubcountyZoneDataService({ searchTerm });

    res.send({
      success: true,
      message: "Subcounty zone data fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(`Error in searchSubcountyZoneDataController: ${error?.message}`, { error });
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  addMasterDataLandUseController,
  getLandUseController,
  updateLandUseController,
  landUseTypeController,
  searchSubcountyZoneDataController,
};