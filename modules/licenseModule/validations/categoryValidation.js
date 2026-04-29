const { enums } = require("../../../constant/enumConstants");
const { UUID_PATTERN } = require("../../../util/regex");
const { INTEGER_PATTERN } = require("../../../util/regex");

const categoryListingValidation = {
  type: "object",
  properties: {
    county_id: { type: "string", pattern: UUID_PATTERN },
    search: { type: "string", transform: enums.TRANSFORM_ENUM },
    service_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["county_id"],
  additionalProperties: false,
};

const subCategoryListingValidation = {
  type: "object",
  properties: {
    category_id: { type: "string", pattern: UUID_PATTERN },
    search: { type: "string", transform: enums.TRANSFORM_ENUM },
    service_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["category_id"],
  additionalProperties: false,
};

const permitListingValidation = {
  type: "object",
  properties: {
    limit: { type: "string", pattern: INTEGER_PATTERN },
    page: { type: "string", pattern: INTEGER_PATTERN },
  },
  required: ["limit", "page"],
};

const permitListingBodyValidation = {
  type: "object",
  properties: {
    countyId: { type: "string", pattern: UUID_PATTERN },
    userId: { type: "string", pattern: UUID_PATTERN },
    serviceId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["countyId", "serviceId"],
};

const subCategoryValidation = {
  type: "object",
  properties: {
    category: { type: "string", transform: enums.TRANSFORM_ENUM },
    search: { type: "string", transform: enums.TRANSFORM_ENUM },
    service_id: { type: "string", pattern: UUID_PATTERN },
    county_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["category", "service_id", "county_id"],
  additionalProperties: false,
};

const multiSubCategoryListingValidation = {
  type: "object",
  properties: {
    category_ids: {
      type: "array",
      items: {
        type: "string",
        pattern: UUID_PATTERN
      }
    },
    search: { type: "string", transform: enums.TRANSFORM_ENUM },
    service_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["category_ids"],
  additionalProperties: false,
};

module.exports = {
  categoryListingValidation,
  subCategoryListingValidation,
  permitListingValidation,
  permitListingBodyValidation,
  subCategoryValidation,
  multiSubCategoryListingValidation
};
