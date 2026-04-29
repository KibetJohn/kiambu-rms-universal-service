const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { UUID_PATTERN } = require("../../../util/regex");

const addMasterDatalicenseAndPermitValidation = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    subCategory: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    amount: { type: "number", multipleOf: 1 },
    applicationFee: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    boardApproval: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    publicParticipation: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    permitFee: { type: "number", multipleOf: 1 },
    period: {
      type: "string"
    }
  },
  required: [
    "category",
    "subCategory",
    "applicationFee",
    "boardApproval",
    "publicParticipation",
    "serviceId",
    "permitFee",
  ],
  additionalProperties: false,
};

const addMasterDataLandRentValidation = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    subCategory: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    amountPaymentType: { type: "string", enum: enums.PAYMENT_TYPES },
    isPartialPaymentAllowed: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    isCertificateApply: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: { type: "string", pattern: UUID_PATTERN },
  },
  required: [
    "category",
    "subCategory",
    "amountPaymentType",
    "isCertificateApply",
    "serviceId",
    "isPartialPaymentAllowed",
  ],
  additionalProperties: false,
};

const licensePeriodValidation = {
  type: "object",
  properties: {
    subCategoryId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    serviceId: { type: "string", pattern: UUID_PATTERN },
  },
  required: [
    "subCategoryId",
    "serviceId",
  ],
  additionalProperties: false,
};

module.exports = {
  addMasterDatalicenseAndPermitValidation,
  addMasterDataLandRentValidation,
  licensePeriodValidation,
};
