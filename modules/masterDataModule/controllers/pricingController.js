const appConstants = require("../../../constant/appConstants");
const logger = require("@lib/logger");
const { sendNotification } = require("../../../lib/rabbitMq");
const {
  pricingDataService,
  pricingListService,
  pricingEditService,
  searchLandRentPricingService,
} = require("../services/pricingService");

const pricingDataController = async (req, res) => {
  const data = await pricingDataService(req.body);

  sendNotification(
    JSON.stringify({
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: data?.services?.name,
      action_details: `Pricing data Added.`,
      role: req.user.type,
      event_type: "CREATED",
      device_id: req.user.device_id || null,
      device_type: "WEB",
      elk_ref_id: req.elk_reference_id || "",
      action_performed_on: data?.pricingId,
      service: data?.services?.name,
      county_id: req.user.county_id,
    }),
    appConstants.QUEUE.PDSL_AUDIT_QUEUE
  );

  res.send({
    message: "Pricing data added successfully.",
  });
};

const pricingDataListController = async (req, res) => {
  res.send({
    message: "Pricing List feched successfully.",
    data: await pricingListService(req.query),
  });
};

const updatePricingDataController = async (req, res) => {
  const data = await pricingEditService(req.body, req.params.id);

  sendNotification(
    JSON.stringify({
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: data?.services?.name,
      action_details: `Pricing data updated.`,
      role: req.user.type,
      event_type: "UPDATED",
      device_id: req.user.device_id || null,
      device_type: "WEB",
      elk_ref_id: req.elk_reference_id || "",
      action_performed_on: data?.pricingId,
      service: data?.services?.name,
      county_id: req.user.county_id,
    }),
    appConstants.QUEUE.PDSL_AUDIT_QUEUE
  );

  res.send({
    message: "Pricing data updated successfully.",
  });
};

const searchLandRentPricingController = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const { landUseId, pathId, zoneId, rateUnit } = req.body;

    const data = await searchLandRentPricingService({
      searchTerm,
      landUseId,
      pathId,
      zoneId,
      rateUnit,
    });

    res.send({
      success: true,
      message: "Land rent pricing data fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(`Error in searchLandRentPricingController: ${error?.message}`, { error });
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  pricingDataController,
  pricingDataListController,
  updatePricingDataController,
  searchLandRentPricingController,
};
