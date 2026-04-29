const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { UUID_PATTERN, EMAIL } = require("../../../util/regex");

const plotNumberValidation = {
  type: "object",
  properties: {
    plotNumber: {
      type: "string",
      transform: ["toUpperCase", "trim"],
    },
  },
  required: ["plotNumber"],
  additionalProperties: false,
};

const payLandRentRateValidation = {
  type: "object",
  properties: {
    pricingId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    userId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    countyId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    phoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
    },
    email: {
      type: "string",
      pattern: EMAIL,
    },
    paymentId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    numberOfMonths: {
      type: "number",
      multipleOf: 1,
    },
    isRenew: {
      type: "boolean",
      enum: enums.BOOLEAN_ENUM,
    },
    partialAmount: {
      type: "number",
      multipleOf: 1,
    },
    partialPaymentId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
  },
  required: [
    "phoneNumber",
    "userId",
    "countyId",
    "pricingId",
    "email",
    "paymentId",
  ],
  allOf: [
    {
      if: {
        required: ["partialPaymentId"],
      },
      then: {
        required: ["partialAmount"],
      },
    },
    {
      if: {
        required: ["partialAmount"],
      },
      then: {
        required: ["partialPaymentId"],
      },
    },
  ],
  additionalProperties: false,
};

const limitPageValidations = {
  type: "object",
  properties: {
    limit: { type: "string" },
    page: { type: "string" },
  },
  required: ["limit", "page"],
};

const getRenewLicensePermitListValidation = {
  type: "object",
  properties: {
    county_id: { type: "string", pattern: UUID_PATTERN },
    user_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["county_id", "user_id"],
  additionalProperties: false,
};

const getOrderSummaryValidation = {
  type: "object",
  properties: {
    subCountyId: { type: "string", pattern: UUID_PATTERN },
    wardId: { type: "string", pattern: UUID_PATTERN },
    categoryId: { type: "string", pattern: UUID_PATTERN },
    subCategoryId: { type: "string", pattern: UUID_PATTERN },
    plotNo: { type: "string", transform: ["trim", "toUpperCase"] },
  },
  required: ["subCountyId", "categoryId", "subCategoryId", "wardId", "plotNo"],
  additionalProperties: false,
};

module.exports = {
  plotNumberValidation,
  payLandRentRateValidation,
  limitPageValidations,
  getRenewLicensePermitListValidation,
  getOrderSummaryValidation,
};
