const { UUID_PATTERN, EMAIL } = require("../../../util/regex");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { enums } = require("../../../constant/enumConstants");

const publicHealthApplicationValidation = {
  type: "object",
  properties: {
    categoryId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    subCategoryId: { type: "string", pattern: UUID_PATTERN },
    email: {
      type: "string",
      pattern: EMAIL,
      errorMessage: "Email format is not correct.",
    },
    amount: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      errorMessage: "Amount must be positive.",
    },
    phoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
      errorMessage: "Phone number is incorrect.",
    },
    description: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    location: { type: "string" },
    uploadedDocuments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                size: { type: "number" },
                type: { type: "string" },
                fileName: { type: "string" },
                originalFileName: { type: "string" },
              },
              required: ["size", "type", "fileName"],
            },
          },
        },
        required: ["key", "files"],
      },
    },
    userId: { type: "string", pattern: UUID_PATTERN },
    paymentPhoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
    },
    isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    businessName: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    businessRegistrationNo: { type: "string" },
    subCountyId: { type: "string", pattern: UUID_PATTERN },
    wardId: { type: "string", pattern: UUID_PATTERN},
    street: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    plotNumber: {
      type: "string",
    },
    floorNumber: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    stallNumber: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    buildingName: {
      type: "string",
      nullable: true,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    poBox: {
      type: "string",
      nullable: false,
    },
    postalCode: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.POSTAL_CODE_LENGTH,
    },
  },
  required: [
    "categoryId",
    "subCategoryId",
    "amount",
    "description",
    "serviceId",
    "userId",
    "subCountyId",
    "wardId"
  ],
  additionalProperties: false,
};

const publicHealthPermitValidation = {
  properties: {
    categoryId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    subCategoryId: { type: "string", pattern: UUID_PATTERN },
    serviceId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    userId: { type: "string", pattern: UUID_PATTERN },
  },
  required: [
    "categoryId",
    "subCategoryId",
  ]
};

module.exports = {
  publicHealthApplicationValidation,
  publicHealthPermitValidation,
};
