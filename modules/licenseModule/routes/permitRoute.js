const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const {
  permitListingValidation,
  permitListingBodyValidation,
} = require("../validations/categoryValidation");
const {
  getPermitListController,
} = require("../controllers/getPermitListController");
const {
  getPermitDetailsController,
  getPermitController,
} = require("../controllers/getPermitDetailsController");
const {
  paramValidation,
  permitCountValidation,
} = require("../validations/licenseApplicationValidation");
const {
  medicalPermitDetailController,
  medicalInternalPermitDetailController,
} = require("../controllers/medicalCertificateController");
const { publicPermitIssuedCountController } = require("../controllers/publicPermitIssuedCountController");

module.exports = [
  route.post(
    "/permit-list",
    [
      authenticate,
      validate(permitListingValidation, "QUERY_STRING"),
      validate(permitListingBodyValidation),
    ],
    getPermitListController
  ),
  route.get(
    "/permit/:id",
    [authenticate, validate(paramValidation, "PARAMS")],
    getPermitDetailsController
  ),
  route.get(
    "/internal/permit/:id",
    [validate(paramValidation, "PARAMS")],
    getPermitController
  ),

  route.get(
    "/medical/permit-details/:id",
    [authenticate, validate(paramValidation, "PARAMS")],
    medicalPermitDetailController
  ),
  
  route.get(
    "/internal/medical/permit-details/:id",
    [validate(paramValidation, "PARAMS")],
    medicalInternalPermitDetailController
  ),

    // public routes
  route.post(
    '/public/pass-penalty-issued-count',
    [validate(permitCountValidation, 'QUERY_STRING')],
    publicPermitIssuedCountController
  ),
];
