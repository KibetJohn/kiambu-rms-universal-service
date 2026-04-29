const { authenticate } = require("../../../lib/auth");
const route = require("../../../lib/route");
const validate = require("../../../lib/validate");
const {
  documentRequestController,
} = require("../controllers/documentRequestController");
const {
  documentRequestValidation,
  uploadDocumentValidation,
} = require("../validations/documentValidation");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const appConstants = require("../../../constant/appConstants");
const {
  paramValidation,
} = require("../validations/licenseApplicationValidation");
const { fetchDocumentList } = require("../controllers/fetchDocumentList");
const {
  uploadDocumentController,
} = require("../controllers/uploadDocumentController");

module.exports = [
  route.post(
    "/document-request",
    [
      authenticate,
      roleCheck([appConstants.USER_TYPE.STAFF_MEMBER], {
        moduleName: "Applications",
        permission: "add",
      }),
      validate(documentRequestValidation),
    ],
    documentRequestController
  ),
  route.get(
    "/document/:id",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.CITIZEN,
        appConstants.USER_TYPE.SUPER_ADMIN,
      ]),
      validate(paramValidation, "PARAMS"),
    ],
    fetchDocumentList
  ),
  route.put(
    "/upload-document/:id",
    [
      authenticate,
      roleCheck([
        appConstants.USER_TYPE.CITIZEN,
        appConstants.USER_TYPE.SUPER_ADMIN,
      ]),
      validate(paramValidation, "PARAMS"),
      validate(uploadDocumentValidation),
    ],
    uploadDocumentController
  ),
];
