const appConstants = require("../../../constant/appConstants");
const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { UUID_PATTERN, INTEGER_PATTERN, DECIMAL_PATTERN, YEAR_PATTERN } = require("../../../util/regex");

const landRateRentPricingValidation = {
  type: "object",
  properties: {
    landUseId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    pathId: { type: "string", pattern: UUID_PATTERN },
    zoneId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    rate: {
      type: "string",
      pattern: DECIMAL_PATTERN,
    },
    serviceId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    year: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: { minimum: "Year must be a positive number." },
    },
    rateUnit: {
      type: "string",
    },
  },
  required: [
    "landUseId",
    "pathId",
    "zoneId",
    "rate",
    "year",
    "serviceId",
  ],
  additionalProperties: false,
};

// const pricingDatavalidation = {
//   type: "object",
//     "plotNo",
//     "serviceId",
//     "subCountyId",
//     "wardId",
//   ],
//   additionalProperties: false,
// };

const pricingDatavalidation = {
  type: "object",
  properties: {
    search: {
      type: "string",
    },
    limit: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: { pattern: "Limit must be positive" },
    },
    page: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: { pattern: "Page must be positive" },
    },
    order: {
      type: "string",
      enum: ["ASC", "DESC"],
    },
  },
  additionalProperties: false,
};

const bulkUploadLandRentRatesPricingValidation = {
  type: "object",
  properties: {
    Path_Code: { 
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    Land_Use_Name: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH
    },
    Zone_Code: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH
    },
    Year: {
      type: "string",
      pattern: YEAR_PATTERN
    },
    Rate_Value: {
      type: "string",
      pattern: DECIMAL_PATTERN
    },
    Rate_Unit: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH
    },
  },
  required: [
    "Path_Code",
    "Land_Use_Name",
    "Zone_Code",
    "Year",
    "Rate_Value",
    "Rate_Unit",
  ],
  additionalProperties: false,
};

const landRentRatesPricingExportValidation = {
  type: "object",
  properties: {
    search: { type: "string", transform: enums.TRANSFORM_ENUM },
    orderBy: { type: "string", enum: ["asc", "desc"] },
  },
  additionalProperties: false,
};

const updateLandRateRentPricingValidation = {
  type: "object",
  properties: {
    landUseId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    pathId: { type: "string", pattern: UUID_PATTERN },
    zoneId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    rate: {
      type: "string",
      pattern: DECIMAL_PATTERN,
    },
    serviceId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    year: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: { pattern: "Year must be a positive number." },
    },
    rateUnit: {
      type: "string",
    },
  },
  required: [
    "landUseId",
    "pathId",
    "zoneId",
    "rate",
    "year",
    "serviceId",
    "rateUnit",
  ],
  additionalProperties: false,
};

const searchLandRentPricingQueryValidation = {
  type: "object",
  properties: {
    searchTerm: { type: "string" },
  },
  additionalProperties: false,
};

const searchLandRentPricingBodyValidation = {
  type: "object",
  properties: {
    landUseId: { type: "string", pattern: UUID_PATTERN,},
    pathId: { 
      type: "string",
      pattern: UUID_PATTERN,
    },
    zoneId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    rateUnit: { type: "string" },
  },
  additionalProperties: false,
};

module.exports = {
  landRateRentPricingValidation,
  pricingDatavalidation,
  bulkUploadLandRentRatesPricingValidation,
  landRentRatesPricingExportValidation,
  updateLandRateRentPricingValidation,
  searchLandRentPricingQueryValidation,
  searchLandRentPricingBodyValidation,
};
