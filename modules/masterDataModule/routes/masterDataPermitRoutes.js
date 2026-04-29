const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");

const {
  getMasterDataLicenseAndPermitController,
  getLandRentRatesListMasterDataController,
  getPublicHealthListController,
  getBuildingApprovalListController,
  getLicensePeriodController
} = require("../controllers/masterDataWithSearchControllers");
const validate = require("../../../lib/validate");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const appConstants = require("../../../constant/appConstants");
const {
  addMasterDataLicenseAndPermitController,
} = require("../controllers/addMasterDatalicenseAndPermitControllers");
const { uploadFile } = require("../../../lib/uploadCsv");
const {
  updateLicenseAndPermitController,
  updateLandRentRatesMasterDataController,
  updatePublicHealthController,
} = require("../controllers/updateMasterDataLicenseAndPermitController");
const masterDatalicenseAndPermitValidation = require("../validations/masterDataLicenseAndPermitValidation");
const {
  addMasterDatalicenseAndPermitValidation,
  addMasterDataLandRentValidation,
  licensePeriodValidation,
} = require("../validations/addMasterDatalicenseAndPermitValidation");
const {
  bulkUploadMasterDataLicenseAndPermitController,
  bulkUploadLandRentRatesMasterDataController,
  bulkUploadPublicHealthDataController,
  bulkUploadBuildingApprovalDataController,
} = require("../controllers/bulkUploadMasterDataLicenseAndPermitControllers");
const {
  exportMasterDataLicenseAndPermitController,
  exportLandRentMasterDataController,
  exportPublicHealthMasterDataController,
  exportBuildingApprovalMasterDataController,
} = require("../controllers/exportMasterDataLicenseAndPermitController");
const {
  updateMasterDataLicenseAndPermitParamsValidation,
} = require("../validations/updateMaterDataLicenseAndPermitValidations");
const {
  addPublicHealthValidation,
} = require("../validations/publicHealthValidation");
const { addBuildingApprovalValidation } = require("../validations/buildingApprovalValidation");

module.exports = [
  route.get(
    "/license-permit",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    getMasterDataLicenseAndPermitController
  ),
  route.post(
    "/license-permit",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(addMasterDatalicenseAndPermitValidation),
    ],
    addMasterDataLicenseAndPermitController
  ),
  route.post(
    "/license-permit/bulk-upload",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      uploadFile.single("license_permits"),
    ],
    bulkUploadMasterDataLicenseAndPermitController
  ),
  route.get(
    "/license-permit/export",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    exportMasterDataLicenseAndPermitController
  ),
  route.put(
    "/license-permit/edit/:id",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(updateMasterDataLicenseAndPermitParamsValidation, "PARAMS"),
      validate(addMasterDatalicenseAndPermitValidation),
    ],
    updateLicenseAndPermitController
  ),

  // Land Rent master data
  route.post(
    "/land-rent/master-data",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(addMasterDataLandRentValidation),
    ],
    addMasterDataLicenseAndPermitController
  ),
  route.get(
    "/land-rent/master-data/export",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    exportLandRentMasterDataController
  ),
  route.get(
    "/land-rent/master-data/list",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    getLandRentRatesListMasterDataController
  ),
  route.post(
    "/land-rent/master-data/bulk-upload",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      uploadFile.single("license_permits"),
    ],
    bulkUploadLandRentRatesMasterDataController
  ),
  route.put(
    "/land-rent/master-data/edit/:id",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(updateMasterDataLicenseAndPermitParamsValidation, "PARAMS"),
      validate(addMasterDataLandRentValidation),
    ],
    updateLandRentRatesMasterDataController
  ),

  //Public health master data
  route.post(
    "/public-health",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(addPublicHealthValidation),
    ],
    addMasterDataLicenseAndPermitController
  ),
  route.get(
    "/public-health",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    getPublicHealthListController
  ),
  route.put(
    "/public-health/:id",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(updateMasterDataLicenseAndPermitParamsValidation, "PARAMS"),
      validate(addPublicHealthValidation),
    ],
    updatePublicHealthController
  ),
  route.get(
    "/public-health/export",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    exportPublicHealthMasterDataController
  ),
  route.post(
    "/public-health/bulk-upload",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      uploadFile.single("public_health"),
    ],
    bulkUploadPublicHealthDataController
  ),

  // Building Approval Master Data
  route.get(
    "/building-approval",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    getBuildingApprovalListController
  ),
  route.get(
    "/building-approval/export",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(masterDatalicenseAndPermitValidation, "QUERY_STRING"),
    ],
    exportBuildingApprovalMasterDataController
  ),
  route.post(
    "/building-approval/bulk-upload",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      uploadFile.single("building_approval"),
    ],
    bulkUploadBuildingApprovalDataController
  ),
  
  route.post(
    "/license-permit/period",
    [
      authenticate,
      validate(licensePeriodValidation),
    ],
    getLicensePeriodController
  ),
];
