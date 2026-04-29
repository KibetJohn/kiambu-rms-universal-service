const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const {
  addMasterDataLandUseValidation,
  getMasterDataLandUseQueryValidation,
  getMasterDataLandUseValidation,
  landUseParamValidation,
  updateLandUseValidation,
  landUseQueryValidation,
} = require("../validations/landUseRegistryValidation");
const appConstants = require("../../../constant/appConstants");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const {
  addMasterDataLandUseController,
  getLandUseController,
  updateLandUseController,
  landUseTypeController,
  searchSubcountyZoneDataController,
} = require("../controllers/landUseController");
const { searchLandRentPricingQueryValidation } = require("../validations/landRentRateValidation");


module.exports = [
  route.post(
    "/land-registry/land-use",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(addMasterDataLandUseValidation),
    ],
    addMasterDataLandUseController
  ),

  route.get(
    "/land-registry/land-use",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(getMasterDataLandUseQueryValidation, "QUERY_STRING"),
      validate(getMasterDataLandUseValidation),
    ],
    getLandUseController
  ),

  route.put(
    "/land-registry/land-use/:id",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(landUseParamValidation, "PARAMS"),
      validate(updateLandUseValidation),
    ],
    updateLandUseController
  ),

  route.get(
    "/land/use-types",
    [
      authenticate,
      validate(landUseQueryValidation,"QUERY_STRING"),
    ],
    landUseTypeController
  ),

  route.get(
    "/subcounty-zone-data/search",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(searchLandRentPricingQueryValidation, "QUERY_STRING"),
    ],
    searchSubcountyZoneDataController
  ),

];
