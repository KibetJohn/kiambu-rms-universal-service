const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { UUID_PATTERN } = require("../../../util/regex");

const addPublicHealthValidation = {
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
    applicationFee: { type: "number", multipleOf: 1 },
    isApplicationFee: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    isBoardApproval: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    isPublicParticipation: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    permitFee: { type: "number" },
    amountPaymentType: { type: "string", enum: enums.PAYMENT_TYPES },
    isCertificateApplicable: { type: "boolean", enum: enums.BOOLEAN_ENUM },
  },
  required: [
    "category",
    "subCategory",
    "applicationFee",
    "isBoardApproval",
    "isPublicParticipation",
    "serviceId",
    "permitFee",
    "isApplicationFee",
  ],
  additionalProperties: false,
};

module.exports = {
  addPublicHealthValidation,
};
