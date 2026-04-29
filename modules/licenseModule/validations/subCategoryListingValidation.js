const { UUID_PATTERN } = require("../../../util/regex");

const subCategoryListingBodyValidation = {
  type: "object",
  properties: {
    category: { type: "string", minLength: 3 },
  },
  required: ["category"],
  additionalProperties: false,
};

const subCategoryListingParamsValidation = {
  type: "object",
  properties: {
    user_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["user_id"],
  additionalProperties: false,
};

module.exports = {
  subCategoryListingBodyValidation,
  subCategoryListingParamsValidation,
};
