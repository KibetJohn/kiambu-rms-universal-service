const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const {
  getSubCategoryListingController,
  getSubCategoryController,
  multiSubCategoryListingController,
} = require("../controllers/subCategoryListingControllers");
const {
  categoryListingValidation,
  subCategoryListingValidation,
  subCategoryValidation,
  multiSubCategoryListingValidation,
} = require("../validations/categoryValidation");
const {
  getCategoryListingController,
} = require("../controllers/getCategoryListingController");

module.exports = [
  route.get(
    "/sub-category/listing",
    [authenticate, validate(subCategoryListingValidation, "QUERY_STRING")],
    getSubCategoryListingController
  ),
  route.get(
    "/category/listing",
    [authenticate, validate(categoryListingValidation, "QUERY_STRING")],
    getCategoryListingController
  ),
  route.get(
    "/sub-category",
    [authenticate, validate(subCategoryValidation, "QUERY_STRING")],
    getSubCategoryController
  ),
  route.post(
    "/multi-sub-category/listing",
    [authenticate, validate(multiSubCategoryListingValidation)],
    multiSubCategoryListingController
  ),
];
