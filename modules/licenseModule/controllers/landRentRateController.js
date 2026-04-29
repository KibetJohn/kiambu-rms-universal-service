const errors = require("../../../lib/errors");
const {
  plotDetailsService,
  payLandRentRateService,
  getOrderSummaryService
} = require("../services/landRentRateService");
const appConstants = require("../../../constant/appConstants");

const plotDetailsController = async (req, res) => {
  res.send({
    message: "Plot Details Fetched Successfully.",
    data: await plotDetailsService(req.query),
  });
};

const payLandRentRateController = async (req, res) => {
  if(!req?.query?.payment_mode) throw errors.INVALID_INPUT("Payment mode is required");

  const isAdmin = req.user.type === appConstants.USER_TYPE.SUPER_ADMIN;
  
  res.send({
    message: "Payment Paid Successfully.",
    data: await payLandRentRateService(
      req.body,
      req.query,
      req.user.id,
      req.headers,
      isAdmin
    ),
  });
};

const getOrderSummaryController = async (req, res) => {
  res.send({
    success: true,
    message: "Order Summary Fetched Successfully.",
    data: await getOrderSummaryService(req.body),
  });
};

module.exports = {
  plotDetailsController,
  payLandRentRateController,
  getOrderSummaryController
};
