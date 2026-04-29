const appConstants = require("../../../constant/appConstants");
const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const {
  INTEGER_PATTERN,
  POSITIVE_NUMBER_PATTERN,
} = require("../../../util/regex");

const bulkUploadLicenseAndPermitValidation = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    subCategory: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    amount: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: {
        pattern: "Amount must be valid number.",
        type: "Amount must be a string.",
      },
    },
    applicationFee: { type: "string", enum: ["TRUE", "FALSE"] },
    boardApproval: { type: "string", enum: ["TRUE", "FALSE"] },
    publicParticipation: { type: "string", enum: ["TRUE", "FALSE"] },
    service: {
      type: "string",
      enum: [
        appConstants.SERVICES.LIQUOR,
        appConstants.SERVICES.ADVERTISEMENT,
        appConstants.SERVICES.OTHER_LICENSE,
        appConstants.SERVICES.LAND_AND_PROPERTIES,
      ],
    },
    permitFee: {
      type: "string",
      pattern: POSITIVE_NUMBER_PATTERN,
      errorMessage: {
        pattern: "must be valid number.",
        type: "must be a string.",
      },
    },
    period: { type: "string" },
  },
  required: [
    "category",
    "subCategory",
    "applicationFee",
    "boardApproval",
    "publicParticipation",
    "service",
    "permitFee",
  ],
  additionalProperties: false,
};

const bulkUploadLandRentRatesValidation = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    subCategory: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    amountPaymentType: { type: "string", enum: enums.PAYMENT_TYPES },
    isPartialPaymentAllowed: { type: "string", enum: ["TRUE", "FALSE"] },
    isCertificateApply: { type: "string", enum: ["TRUE", "FALSE"] },
    service: {
      type: "string",
      enum: [appConstants.SERVICES.LAND_RENT_AND_RATES],
    },
  },
  required: [
    "category",
    "subCategory",
    "amountPaymentType",
    "isCertificateApply",
    "service",
    "isPartialPaymentAllowed",
  ],
  additionalProperties: false,
};

const bulkUploadPublicHealthValidation = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    subCategory: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    applicationFee: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: {
        pattern: "Application fee must be valid number.",
        type: "Application fee must be a string.",
      },
    },
    isApplicationFee: { type: "string", enum: ["TRUE", "FALSE"] },
    isBoardApproval: { type: "string", enum: ["TRUE", "FALSE"] },
    isPublicParticipation: { type: "string", enum: ["TRUE", "FALSE"] },
    service: {
      type: "string",
      enum: [
        appConstants.SERVICES.MEDICAL_CERTIFICATE,
        appConstants.SERVICES.FOOD_HYGIENE,
        appConstants.SERVICES.OCCUPATIONAL_CERTIFICATE,
      ],
    },
    permitFee: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: {
        pattern: "Permit Fee must be valid number.",
        type: "Permit Fee must be a string.",
      },
    },
    paymentFrequency: {
      type: "string",
      enum: enums.PAYMENT_TYPES,
    },
  },
  required: [
    "category",
    "subCategory",
    "applicationFee",
    "isApplicationFee",
    "isBoardApproval",
    "isPublicParticipation",
    "service",
    "permitFee",
    "paymentFrequency",
  ],
  additionalProperties: false,
};

const bulkUploadBuildingApprovalValidation = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    subCategory: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    applicationFee: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: {
        pattern: "Application fee must be valid number.",
        type: "Application fee must be a string.",
      },
    },
    isApplicationFee: { type: "string", enum: ["TRUE", "FALSE"] },
    isBoardApproval: { type: "string", enum: ["TRUE", "FALSE"] },
    isPublicParticipation: { type: "string", enum: ["TRUE", "FALSE"] },
    service: {
      type: "string",
      enum: [appConstants.SERVICES.BUILDING_APPROVAL],
    },
    permitFee: {
      type: "string",
      pattern: INTEGER_PATTERN,
      errorMessage: {
        pattern: "Permit Fee must be valid number.",
        type: "Permit Fee must be a string.",
      },
    },
    paymentFrequency: {
      type: "string",
      enum: enums.PAYMENT_TYPES,
    },
  },
  required: [
    "category",
    "subCategory",
    "applicationFee",
    "isApplicationFee",
    "isBoardApproval",
    "isPublicParticipation",
    "service",
    "permitFee",
    "paymentFrequency",
  ],
  additionalProperties: false,
};

module.exports = {
  bulkUploadLicenseAndPermitValidation,
  bulkUploadLandRentRatesValidation,
  bulkUploadPublicHealthValidation,
  bulkUploadBuildingApprovalValidation,
};
