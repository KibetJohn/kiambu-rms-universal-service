const logger = require("@lib/logger");
const { getZones } = require("../services/landZones");
const {
  subcountyZoneService,
  fetchSubcountyZoneData,
  updateSubcountyZoneService,
} = require("../services/zoneDataService");
const { getPathCodes } = require("../services/pathCode");
const { getRateUnits } = require("../services/rateUnits");

const landZonesController = async (req, res) => {
  res.send({
    message: "Zones fetched successfully.",
    data: await getZones(req.query),
  });
};

const pathCodesController = async (req, res) => {
  res.send({
    message: "Path codes fetched successfully.",
    data: await getPathCodes(req.query),
  });
};

const rateUnitsController = async (req, res) => {
  res.send({
    message: "Rate units fetched successfully.",
    data: await getRateUnits(req.query),
  });
};

const createSubcountyZoneController = async (req, res) => {
  try {
    const data = await subcountyZoneService(req.body, req.user.id);

    res.send({
      message: "Zone data saved successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      `Error in creating subcounty zone data controller: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

const getSubcountyZoneController = async (req, res) => {
  try {
    const data = await fetchSubcountyZoneData(req.query);

    res.send({
      message: "Zone data fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      `Error in fetching subcounty zone data controller: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

const updateSubcountyZoneController = async (req, res) => {
  try {
    const data = await updateSubcountyZoneService(
      req.params.id,
      req.body,
      req.user?.id
    );

    res.send({
      message: "Zone data updated successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      `Error in updating subcounty zone data controller: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

module.exports = {
  landZonesController,
  pathCodesController,
  rateUnitsController,
  createSubcountyZoneController,
  getSubcountyZoneController,
  updateSubcountyZoneController,
};