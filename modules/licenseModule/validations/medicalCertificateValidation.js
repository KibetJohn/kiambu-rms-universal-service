const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { UUID_PATTERN } = require("../../../util/regex");

const medicalCertificateApplicationValidation = {
  type: "object",
  properties: {
    applicationForStaff: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    medicalApplication: {
      type: "array",
      items: {
        type: "object",
        properties: {
          staffName: { type: "string" , transform: enums.TRANSFORM_ENUM},
          documentNumber: { type: "string", minLength: 7 },
          categoryId: {
            type: "string",
            minLength: validationConstants.STRING_MIN_LENGTH,
            transform: enums.TRANSFORM_ENUM,
          },
          subCategoryId: {
            type: "string",
            minLength: validationConstants.STRING_MIN_LENGTH,
            transform: enums.TRANSFORM_ENUM,
          },
          description: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
          phoneNumber: {
            type: "string",
            minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
            maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
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
        },
        required: [
          "documentNumber",
          "categoryId",
          "subCategoryId",
          "description",
          "email",
          "phoneNumber",
          "location",
          "uploadedDocuments",
        ],
      },
    },
    paymentPhoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
    },
    businessName: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    businessRegistrationNo: { type: "string" },
    subCountyId: { type: "string", pattern: UUID_PATTERN },
    wardId: {type: "string", pattern: UUID_PATTERN},
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
    "applicationForStaff",
    "serviceId",
    "medicalApplication",
    "subCountyId",
    "wardId"
  ],
  additionalProperties: false,
  if: {
    properties: { applicationForStaff: { const: true } }
  },
  then: {
    properties: {
      medicalApplication: {
        items: {
          required: [
            "documentNumber",
            "categoryId",
            "subCategoryId",
            "description",
            "email",
            "phoneNumber",
            "location",
            "uploadedDocuments",
            "staffName",
          ],
        },
      },
    },
  },
  else: {
    properties: {
      medicalApplication: {
        items: {
          required: [
            "documentNumber",
            "categoryId",
            "subCategoryId",
            "description",
            "email",
            "phoneNumber",
            "location",
            "uploadedDocuments",
          ],
        },
      },
    },
  },
};

const MedicalPermitDuplicateCheckValidation = {
  type: "object",
  properties: {
    categoryId: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    subCategoryId: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    applicationForStaff: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    documentNumber: { type: "string", minLength: 7 },
  },
  required: ["categoryId", "subCategoryId", "serviceId"],
  additionalProperties: false,

  if: {
    properties: { applicationForStaff: { const: true } },
  },
  then: {
    required: ["documentNumber"],
  },
};

module.exports = {
  medicalCertificateApplicationValidation,
  MedicalPermitDuplicateCheckValidation,
};
