const appConstants = require("../../../constant/appConstants");
const { authenticate } = require("../../../lib/auth");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const validate = require("../../../lib/validate");
const route = require("../../../lib/route");
const {
  licenseApplicationValidation,
  paramValidation,
  updateLicenseValidation,
  statusValidation,
  requestInspectionValidation,
  notificationCountValidation,
  notificationsDataValidation,
  paginationQueryValidation,
  updateNotificationValidation,
  permitIdParamValidation,
  updateInspectionRequestBodyValidation,
  submitInspectionRequestReportBodyValidation,
  inspectionListingValidation,
  cancelLicenseQueryValidation,
  checkLicenseApplication,
  licenseDetailsValidation,
  payPermitValidation,
  serviceTypeValidation,
  licenseDuplicateCheckValidation,
  verifyPermitValidation,
} = require("../validations/licenseApplicationValidation");
const {
  licenseApplicationController,
  licenceDuplicateCheckController,
  publicPermitDataController,
  licensePermitDataController,
} = require("../controllers/licenseApplicationController");
const {
  getLicenseListFromIdsController,
} = require("../controllers/getTransactionRecordController");
const {
  paymentModeValidation,
} = require("../validations/paymentModeValidation");
const {
  updateLicenseController,
} = require("../controllers/updateLicenseController");
const {
  applicationStatusController,
  landParcelStatusController,
} = require("../controllers/applicationStatusController");
const {
  inspectionRequestController,
  updateInspectionRequestStatusController,
  submitInspectionRequestReportController,
  inspectionHistoryListingController,
} = require("../controllers/inspectionRequestController");
const {
  getNotificationCountController,
  getNotificationDataController,
  updateNotificationController,
  getNotificationDetailsController,
} = require("../controllers/notificationController");
const {
  getApplicationPaymentHistoryController,
} = require("../controllers/applicationPaymentHistoryController");
const {
  fetchLicensePermitDetailsController,
  fetchLicenseDetailsController,
} = require("../controllers/fetchLicensePermitDetailsController");
const {
  cancelLicenseController,
} = require("../controllers/cancelLicenseController");
const {
  payPermitFeeController,
} = require("../controllers/payPermitController");
const {
  checkLicenseApplicationController,
} = require("../controllers/checkLicenseApplicationController");
const {
  medicalCertificateApplicationValidation, MedicalPermitDuplicateCheckValidation
} = require("../validations/medicalCertificateValidation");
const {
  addMedicalCertificateController, medicalPermitDuplicateCheckController
} = require("../controllers/medicalCertificateController");
const { submitApplicationValidation, buildingPermitDuplicateCheckValidation, draftApplicationValidation } = require("../validations/buildingApprovalValidations");
const { submitBuildingPermitApplicationController, checkDuplicateBuildingPermitController, submitDraftDevelopmentApplicationController } = require("../controllers/buildingApprovalPermitApplicationController");
const { buildingApprovalPermitDetailsController } = require("../controllers/buildingApprovalPermitApplicationController");

require("../scheduler/licenseSchedulers");

module.exports = [
  route.post(
    "/application/license-permit",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(licenseApplicationValidation),
      validate(paymentModeValidation, "QUERY_STRING"),
    ],
    licenseApplicationController
  ),

  route.put(
    "/license-permit/:id",
    [validate(updateLicenseValidation), validate(paramValidation, "PARAMS")],
    updateLicenseController
  ),
  route.put(
    "/application-status/:id",
    [validate(statusValidation), validate(paramValidation, "PARAMS")],
    applicationStatusController
  ),

  route.put(
    "/application/land-parcel-status/:id",
    [validate(statusValidation), validate(paramValidation, "PARAMS")],
    landParcelStatusController
  ),

  // Internal transaction API call
  route.post(
    "/transaction/license-details",
    [],
    getLicenseListFromIdsController
  ),

  route.get(
    "/application/:id",
    [
      authenticate,
      validate(paramValidation, "PARAMS"),
      validate(serviceTypeValidation, "QUERY_STRING"),
    ],
    fetchLicensePermitDetailsController
  ),

  // Update application inspection request status
  route.post(
    "/application/inspection-request/:license_id",
    [authenticate, validate(requestInspectionValidation, "PARAMS")],
    inspectionRequestController
  ),

  // Get unread notification count
  route.get(
    "/notification-count",
    [authenticate, validate(notificationCountValidation, "QUERY_STRING")],
    getNotificationCountController
  ),

  // Get notifications data
  route.post(
    "/notifications",
    [
      authenticate,
      validate(notificationsDataValidation),
      validate(paginationQueryValidation, "QUERY_STRING"),
    ],
    getNotificationDataController
  ),

  // Update notifications read
  route.post(
    "/update-notification/:id",
    [authenticate, validate(updateNotificationValidation)],
    updateNotificationController
  ),

  route.get(
    "/application/payment-history/listing/:permitId",
    [
      authenticate,
      validate(paginationQueryValidation, "QUERY_STRING"),
      validate(permitIdParamValidation, "PARAMS"),
    ],
    getApplicationPaymentHistoryController
  ),

  // Get notifications details
  route.get(
    "/notification/:permitId",
    [authenticate, validate(permitIdParamValidation, "PARAMS")],
    getNotificationDetailsController
  ),

  // Update accept/reject application inspection
  route.post(
    "/inspection-request",
    [authenticate, validate(updateInspectionRequestBodyValidation)],
    updateInspectionRequestStatusController
  ),

  // Submit application inspection report
  route.post(
    "/enforcer/premise-inspection-report/:permitId",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.FIELD_AGENT]),
      validate(permitIdParamValidation, "PARAMS"),
      validate(submitInspectionRequestReportBodyValidation),
    ],
    submitInspectionRequestReportController
  ),

  // get inspection listing for a enforcer
  route.get(
    "/enforcer/inspection-list",
    [authenticate, validate(inspectionListingValidation, "QUERY_STRING")],
    inspectionHistoryListingController
  ),

  route.get(
    "/cancel-license/:permitId",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
      validate(permitIdParamValidation, "PARAMS"),
      validate(cancelLicenseQueryValidation, "QUERY_STRING"),
    ],
    cancelLicenseController
  ),
  route.post(
    "/check/license-application",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(checkLicenseApplication),
    ],
    checkLicenseApplicationController
  ),
  route.post(
    "/license-details",
    [authenticate, validate(licenseDetailsValidation)],
    fetchLicenseDetailsController
  ),
  route.post(
    "/pay/license-permit",
    [
      authenticate,
      validate(paymentModeValidation, "QUERY_STRING"),
      validate(payPermitValidation),
    ],
    payPermitFeeController
  ),
  route.post(
    "/medical-permit",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.SUPER_ADMIN,
        appConstants.USER_TYPE.CITIZEN,
      ]),
      validate(medicalCertificateApplicationValidation),
      validate(paymentModeValidation, "QUERY_STRING"),
    ],
    addMedicalCertificateController
  ),

  route.post(
    "/application/building-approval",
    [
      authenticate,
      validate(submitApplicationValidation),
      validate(paymentModeValidation, "QUERY_STRING"),
    ],
    submitBuildingPermitApplicationController
  ),

  route.post(
    "/draft-application/development-approval",
    [
      authenticate,
      validate(draftApplicationValidation),
    ],
    submitDraftDevelopmentApplicationController
  ),
  
  route.get(
    "/building-approval/permit-details/:id",
    [authenticate, validate(paramValidation, "PARAMS")],
    buildingApprovalPermitDetailsController
  ),

  route.post(
    "/check-duplicate-permit",
    [
      authenticate,
      validate(licenseDuplicateCheckValidation),
    ],
    licenceDuplicateCheckController
  ),

  route.post(
    "/check-duplicate-permit/building-approval",
    [
      authenticate,
      validate(buildingPermitDuplicateCheckValidation),
    ],
    checkDuplicateBuildingPermitController
  ),

  route.post(
    "/medical/check-duplicate-permit",
    [
      authenticate,
      validate(MedicalPermitDuplicateCheckValidation),
    ],
    medicalPermitDuplicateCheckController
  ),

  route.get(
    "/permits/verify-permit/:referenceNumber",
    [
      validate(verifyPermitValidation, "PARAMS"),
    ],
    publicPermitDataController
  ),

  route.get(
    "/license-permit/verify/:referenceNumber",
    [
      authenticate,
      validate(verifyPermitValidation, "PARAMS"),
    ],
    licensePermitDataController
  ),
  route.get(
    "/api/license-permit/:referenceNumber",
    [
      validate(verifyPermitValidation, "PARAMS"),
    ],
    licensePermitDataController
  ),
];