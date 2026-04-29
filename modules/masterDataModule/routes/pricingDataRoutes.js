const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const appConstants = require("../../../constant/appConstants");
const {
  landRateRentPricingValidation,
  pricingDatavalidation,
  landRentRatesPricingExportValidation,
  updateLandRateRentPricingValidation,
  searchLandRentPricingQueryValidation,
  searchLandRentPricingBodyValidation,
} = require("../validations/landRentRateValidation");
const {
  pricingDataController,
  pricingDataListController, updatePricingDataController,
  searchLandRentPricingController,
} = require("../controllers/pricingController");
const { uploadFile } = require("../../../lib/uploadCsv");
const {
  bulkUploadLandRentRatesPricingMasterDataController,
} = require("../controllers/bulkUploadPricingMasterDataControllers");
const { exportLandRentPricingMasterDataController } = require("../controllers/landRentRatesPricingExportController");
const { paramValidation } = require("../../licenseModule/validations/licenseApplicationValidation");

module.exports = [
  route.post(
    "/land-rent-rate/pricing",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(landRateRentPricingValidation),
    ],
    pricingDataController
  ),
  route.get(
    "/land-rent-rate/pricing",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(pricingDatavalidation, "QUERY_STRING"),
    ],
    pricingDataListController
  ),
  route.put(
    "/land-rent-rate/pricing/:id",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(paramValidation,"PARAMS"),
      validate(updateLandRateRentPricingValidation),
    ],
    updatePricingDataController
  ),

  route.post(
    "/land-rent-rate/pricing/bulk-upload",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      uploadFile.single("pricing_data"),
    ],
    bulkUploadLandRentRatesPricingMasterDataController
  ),

  route.get(
    '/land-rent-rate/pricing/export',
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(landRentRatesPricingExportValidation, 'QUERY_STRING'),
    ], 
    exportLandRentPricingMasterDataController
  ),

  route.post(
    "/land-rent-rate/pricing/search",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(searchLandRentPricingQueryValidation, "QUERY_STRING"),
      validate(searchLandRentPricingBodyValidation),
    ],
    searchLandRentPricingController
  ),
];