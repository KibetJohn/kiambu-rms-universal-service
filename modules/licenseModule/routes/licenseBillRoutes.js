const appConstants = require("../../../constant/appConstants");
const { authenticate } = require("../../../lib/auth");
const route = require("../../../lib/route");
const validate = require("../../../lib/validate");
const {
  billRequestController,
  billListingController,
} = require("../controllers/licenseBillController");
const {
  billRequestValidation,
  paramValidation,
  payBillValidation,
  paginationQueryValidation,
} = require("../validations/licenseApplicationValidation");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const {
  paymentModeValidation,
} = require("../validations/paymentModeValidation");
const { payBillController } = require("../controllers/licenseBillController");

module.exports = [
  route.post(
    "/bill-request",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.STAFF_MEMBER], {
        moduleName: "Applications",
        permission: "add",
      }),
      validate(billRequestValidation),
    ],
    billRequestController
  ),

  route.get(
    "/bill/:id",
    [
      authenticate,
      validate(paramValidation, "PARAMS"),
      validate(paginationQueryValidation, "QUERY_STRING"),
    ],
    billListingController
  ),

  route.post(
    "/pay-bill",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.CITIZEN,
        appConstants.USER_TYPE.SUPER_ADMIN,
      ]),
      validate(paymentModeValidation, "QUERY_STRING"),
      validate(payBillValidation),
    ],
    payBillController
  ),
];
