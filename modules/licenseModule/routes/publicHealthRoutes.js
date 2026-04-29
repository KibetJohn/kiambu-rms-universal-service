const appConstants = require("../../../constant/appConstants");
const { authenticate } = require("../../../lib/auth");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const validate = require("../../../lib/validate");
const route = require("../../../lib/route");
const {
  paymentModeValidation,
} = require("../validations/paymentModeValidation");

const { publicHealthApplicationController, publicHealthPermitCheckController } = require("../controllers/publicHealthApplicationController");
const { publicHealthApplicationValidation, publicHealthPermitValidation } = require("../validations/publicHealthValidation");

require('../scheduler/licenseSchedulers');

module.exports = [
  // Submit application for Food Hygiene and Occupational Certificate
  route.post(
    "/application/public-health",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(publicHealthApplicationValidation),
      validate(paymentModeValidation, "QUERY_STRING"),
    ],
    publicHealthApplicationController
  ),

  route.post(
    "/public-health/check-duplicate-permit",
    [
      authenticate,
      validate(publicHealthPermitValidation),
    ],
    publicHealthPermitCheckController
  ),
];