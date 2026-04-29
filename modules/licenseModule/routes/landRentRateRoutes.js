const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const {
  plotNumberValidation,
  payLandRentRateValidation,
  getRenewLicensePermitListValidation,
  limitPageValidations,
  getOrderSummaryValidation,
} = require("../validations/landRentRateValidation");
const {
  plotDetailsController,
  payLandRentRateController,
  getOrderSummaryController,
} = require("../controllers/landRentRateController");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const appConstants = require("../../../constant/appConstants");
const {
  paymentModeValidation,
} = require("../validations/paymentModeValidation");
const {
  renewLicensePermitListController,
} = require("../controllers/renewLicenseController");
const {
  landRentRatePricingController,
} = require("../controllers/pricingController");

module.exports = [
  route.get(
    "/land-rent-rate/plot-details",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(plotNumberValidation, "QUERY_STRING"),
    ],
    plotDetailsController
  ),
  route.post(
    "/pay/land-rent-rate",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(payLandRentRateValidation),
      validate(paymentModeValidation, "QUERY_STRING"),
    ],
    payLandRentRateController
  ),

  route.post(
    "/renew-license/list",
    [
      authenticate,
      validate(getRenewLicensePermitListValidation),
      validate(limitPageValidations, "QUERY_STRING"),
    ],
    renewLicensePermitListController
  ),

  route.post(
    "/order-summary",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(getOrderSummaryValidation),
    ],
    getOrderSummaryController
  ),

  route.get(
    "/land-rent-rates/internal/pricing-details",
    [],
    landRentRatePricingController
  ),
];
