const {
  landRentRatePricingService,
} = require("../services/landRentRateService");

const landRentRatePricingController = async (req, res) => {
  try {
    res.send({
      message: "Land rent rates pricing details fetched successfully.",
      data: await landRentRatePricingService({
        "pricing_data.id": req.query.pricingId,
        "pricing_data.is_active": true,
        "permit_master_data.is_active": true,
      }),
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  landRentRatePricingController,
};
