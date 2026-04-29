const appConstants = require("../../../constant/appConstants");
const { enums } = require("../../../constant/enumConstants");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { UUID_PATTERN } = require("../../../util/regex");

const submitApplicationValidation = {
  type: "object",
  properties: {
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    draftId: { type: "string", pattern: UUID_PATTERN },
    revisionId: { type: "string", pattern: UUID_PATTERN },
    paymentPhoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
    },
    isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    declarations: {
      type: "object",
      properties: {
        applicationOwner: { type: "string", enum: enums.TYPES },
        titleType: { type: "string", enum: enums.TITLE_TYPE },
      },
      required: [
        "applicationOwner",
        "titleType",
      ],
      additionalProperties: false,
    },
    personalDetails: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        identificationNumber: { type: "string", minLength: 1 },
        occupation: { type: "string", minLength: 1 },
        phoneNumber: {
          type: "string",
          minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
          maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
        },
        email: { type: "string" },
        companyName: {
          type: "string",
          minLength: validationConstants.STRING_MIN_LENGTH,
          maxLength: validationConstants.STRING_MAX_LENGTH,
        },
      },
      required: [
        "name",
        "identificationNumber",
        "occupation",
        "phoneNumber",
        "email",
      ],
      additionalProperties: false,
    },
    landDetails: {
      type: "object",
      properties: {
        categoryId: { type: "string", pattern: UUID_PATTERN },
        subCategoryId: { type: "string", pattern: UUID_PATTERN },
        noOfFloors: { type: "string", minLength: 1 },
        storageOwner: { type: "string", enum: enums.STORAGE_OWNER },
        size: { type: "string" },
        plotNo: { type: "string" },
        registeredPlanNo: { type: "string" },
        valuation: { type: "string" },
        address: { type: "string" },
        postalCode: { type: "string" },
        subCountyId: { type: "string", pattern: UUID_PATTERN }
      },
      required: [
        "categoryId",
        "subCategoryId",
        "noOfFloors",
        "storageOwner",
        "size",
        "valuation",
        "registeredPlanNo",
        "address",
        "plotNo",
        "postalCode",
        "subCountyId"
      ],
      additionalProperties: false,
    },
    professionalDetails: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
          phoneNumber: { type: "string" },
          professionalMembership: { type: "string", minLength: 1 },
          registrationNumber: { type: "string", minLength: 1 },
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
          "name",
          "email",
          "phoneNumber",
          "professionalMembership",
          "registrationNumber",
        ],
        additionalProperties: false,
      },
    },
    documents: {
      type: "object",
      properties: {
        architecturalLicense: { type: "string", minLength: 1 },
        engineerLicense: { type: "string", minLength: 1 },
        leaseTitle: { type: "string", minLength: 1 },
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
        "architecturalLicense",
        "engineerLicense",
        "leaseTitle",
        "uploadedDocuments",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "serviceId",
    "countyId",
    "documents",
    "professionalDetails",
    "personalDetails",
    "landDetails",
  ],
  additionalProperties: false,
};

const buildingPermitDuplicateCheckValidation = {
  type: "object",
      properties: {
        categoryId: { type: "string", pattern: UUID_PATTERN },
        subCategoryId: { type: "string", pattern: UUID_PATTERN },
        serviceId: { type: "string", pattern: UUID_PATTERN },
        countyId: { type: "string", pattern: UUID_PATTERN },
      },
      required: [
        "categoryId",
        "subCategoryId",
        "serviceId"
      ],
      additionalProperties: false,
  };

  const draftApplicationValidation = {
    type: "object",
    properties: {
      serviceId: { type: "string", pattern: UUID_PATTERN },
      countyId: { type: "string", pattern: UUID_PATTERN },
      draftId: { type: "string", pattern: UUID_PATTERN },
      paymentPhoneNumber: {
        type: "string",
        minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
        maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
      },
      isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
      declarations: {
        type: "object",
        properties: {
          applicationOwner: { type: "string", enum: enums.TYPES },
          titleType: { type: "string", enum: enums.TITLE_TYPE },
        },
        required: [
          "applicationOwner",
          "titleType",
        ],
        additionalProperties: false,
      },
      personalDetails: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          identificationNumber: { type: "string", minLength: 1 },
          occupation: { type: "string", minLength: 1 },
          phoneNumber: {
            type: "string",
            minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
            maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
          },
          email: { type: "string" },
          companyName: {
            type: "string",
            minLength: validationConstants.STRING_MIN_LENGTH,
            maxLength: validationConstants.STRING_MAX_LENGTH,
          },
        },
        additionalProperties: false,
      },
      landDetails: {
        type: "object",
        properties: {
          categoryId: { type: "string", pattern: UUID_PATTERN },
          subCategoryId: { type: "string", pattern: UUID_PATTERN },
          noOfFloors: { type: "string", minLength: 1 },
          storageOwner: { type: "string", enum: enums.STORAGE_OWNER },
          size: { type: "string" },
          plotNo: { type: "string" },
          registeredPlanNo: { type: "string" },
          valuation: { type: "string" },
          address: { type: "string" },
          postalCode: { type: "string" },
          subCountyId: { type: "string", pattern: UUID_PATTERN }
        },
        additionalProperties: false,
      },
      professionalDetails: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            phoneNumber: { type: "string" },
            professionalMembership: { type: "string", minLength: 1 },
            registrationNumber: { type: "string", minLength: 1 },
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
          additionalProperties: false,
        },
      },
      documents: {
        type: "object",
        properties: {
          architecturalLicense: { type: "string", minLength: 1 },
          engineerLicense: { type: "string", minLength: 1 },
          leaseTitle: { type: "string", minLength: 1 },
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
        additionalProperties: false,
      },
    },
    required: [
      "serviceId",
      "countyId",
      "declarations",
    ],
    additionalProperties: false,
  };

module.exports = { 
  submitApplicationValidation,
  buildingPermitDuplicateCheckValidation,
  draftApplicationValidation,
};
