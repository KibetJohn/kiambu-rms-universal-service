const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const appConstants = require("../../../constant/appConstants");
const {
  landParcelValidation,
  landParcelSearchValidation,
  landParcelQueryValidation,
  landListingValidation,
  landSubdivisionApplicationValidation,
  landUseChangeApplicationValidation,
  getLandParcelByLrnoValidation,
} = require("../validations/landRegistryValidation");
const {
  landParcelApplicationController,
  landParcelSearchController,
  getLandParcelListController,
  landSubdivisionApplicationController,
  landUseChangeApplicationController,
  getAllLandParcelsController,
  getLandParcelCountController,
  getLandParcelDataController,
} = require("../controllers/landRegistryController");


module.exports = [
  route.post(
    "/land/parcel-registration",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(landParcelValidation),
    ],
    landParcelApplicationController
  ),

  route.post(
    "/land/search-parcel",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(landParcelSearchValidation,),
      validate(landParcelQueryValidation, "QUERY_STRING"),
    ],
    landParcelSearchController
  ),

  route.post(
    "/land/parcel-list",
    [
      authenticate,
      validate(landListingValidation, "QUERY_STRING"),
      validate(landParcelSearchValidation),
    ],
    getLandParcelListController
  ),

  route.post(
    "/land/subdivision-application",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(landSubdivisionApplicationValidation),
    ],
    landSubdivisionApplicationController
  ),

  route.post(
    "/land/change-of-use",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(landUseChangeApplicationValidation),
    ],
    landUseChangeApplicationController
  ),

  route.post(
    "/land/admin/parcel-list",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.STAFF_MEMBER,
      ]),
      validate(landListingValidation, "QUERY_STRING"),
      validate(landParcelSearchValidation),
    ],
    getAllLandParcelsController
  ),

  route.post(
    "/land/admin/parcel-count",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.STAFF_MEMBER,
      ]),
      validate(landParcelSearchValidation),
    ],
    getLandParcelCountController
  ),

  route.get(
    "/land-parcel/:lrno",
    [
      authenticate,
      validate(getLandParcelByLrnoValidation, "PARAMS"),
    ],
    getLandParcelDataController
  ),
];
