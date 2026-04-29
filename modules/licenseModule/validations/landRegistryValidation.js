const { UUID_PATTERN, INTEGER_PATTERN } = require("../../../util/regex");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { enums } = require("../../../constant/enumConstants");

const landParcelValidation = {
  type: "object",
  properties: {
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    userId: { type: "string", pattern: UUID_PATTERN },
    personalDetails: {
      type: "object",
      properties: {
        firstName: { 
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        lastName: { 
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        otherName: {
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
        },
        identificationNumber: {
          type: "string",
          minLength: 1,
        },
        kraPin: {
          type: 'string',
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        mobileNumber: {
          type: "string",
          minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
          maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
        },
        email: { type: "string" },
      },
      required: [
        "firstName",
        "lastName",
        "identificationNumber",
        "kraPin",
        "mobileNumber",
        "email",
      ],
      additionalProperties: false,
    },
    landDetails: {
      type: "object",
      properties: {
        landSize: { type: "string" },
        landNo: {
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength:validationConstants.STRING_MIN_LENGTH,
        },
        subCountyId: { type: "string", pattern: UUID_PATTERN },
        wardId: { type: "string", pattern: UUID_PATTERN },
        longitude: { type: "string" },
        latitude: { type: "string" },
        village: {
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength:validationConstants.STRING_MIN_LENGTH,
        },
        landUseId: {type: "string", pattern: UUID_PATTERN},
        year: { type: "string" },
      },
      required: [
        "landNo",
        "landSize",
        "subCountyId",
        "wardId",
        "landUseId",
        "village",
        "longitude",
        "latitude",
        "year",
      ],
      additionalProperties: false,
    },
    documents: {
      type: "object",
      properties: {
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
    "documents",
    "personalDetails",
    "landDetails"
  ],
  additionalProperties: false,
};

const landParcelSearchValidation = {
  type: "object",
  properties: {
    countyId: { type: "string", pattern: UUID_PATTERN },
    userId: { type: "string", pattern: UUID_PATTERN },
    serviceId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["countyId"],
  additionalProperties: false,
};

const landParcelQueryValidation = {
  type: "object",
  properties: {
    search: {
      type: "string",
      maxLength:validationConstants.STRING_MAX_LENGTH,
      minLength:validationConstants.STRING_MIN_LENGTH,
    },
  },
  required: ["search"],
  additionalProperties: false, 
};

const landListingValidation = {
  type: "object",
  properties: {
    limit: { type: "string", pattern: INTEGER_PATTERN },
    page: { type: "string", pattern: INTEGER_PATTERN },
  },
  required: ["limit", "page"],
};

const landSubdivisionApplicationValidation = {
  type: "object",
  properties: {
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    applicationType: { type: "string", enum: ["SUBDIVISION"] },
    isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    userId: { type: "string", pattern: UUID_PATTERN },
    personalDetails: {
      type: "object",
      properties: {
        firstName: { 
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        lastName: { 
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        otherName: {
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
        },
        identificationNumber: {
          type: "string",
          minLength: 1,
        },
        kraPin: {
          type: 'string',
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        mobileNumber: {
          type: "string",
          minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
          maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
        },
        email: { type: "string" },
      },
      required: [
        "firstName",
        "lastName",
        "identificationNumber",
        "kraPin",
        "mobileNumber",
        "email",
      ],
      additionalProperties: false,
    },
    parentParcel: {
      type: "object",
      properties: {
        parentLrNumber: {
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
          minLength:validationConstants.STRING_MIN_LENGTH,
        },
        parentSize: {
          type: "string",
          maxLength:validationConstants.STRING_MAX_LENGTH,
        },
        parcelId: { type: "string", pattern: UUID_PATTERN },
      },
      required: ["parentLrNumber", "parentSize", "parcelId"],
      additionalProperties: false,
    },
    proposedPlots: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          plotLabel: {
            type: "string",
            maxLength:validationConstants.STRING_MAX_LENGTH,
            minLength:validationConstants.STRING_MIN_LENGTH,
          },
          area: { type: "string" },
          accessRoad: { type: "string" },
        },
        required: ["plotLabel", "area"],
        additionalProperties: false,
      },
    },
    gisLocation: {
      type: "object",
      properties: {
        location: { type: "string" },
        latitude: { type: "string" },
        longitude: { type: "string" },
      },
      required: ["latitude", "longitude"],
      additionalProperties: false,
    },
    documents: {
      type: "object",
      properties: {
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
    "applicationType",
    "personalDetails",
    "parentParcel",
    "proposedPlots",
    "gisLocation",
    "documents",
  ],
  additionalProperties: false,
};

const landUseChangeApplicationValidation = {
  type: "object",
  properties: {
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    userId: { type: "string", pattern: UUID_PATTERN },
    personalDetails: {
      type: "object",
      properties: {
        firstName: {
          type: "string",
          maxLength: validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        lastName: {
          type: "string",
          maxLength: validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        otherName: {
          type: "string",
          maxLength: validationConstants.STRING_MAX_LENGTH,
        },
        identificationNumber: { type: "string", minLength: 1 },
        kraPin: {
          type: "string",
          maxLength: validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        mobileNumber: {
          type: "string",
          minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
          maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
        },
        email: { type: "string" },
      },
      required: [
        "firstName",
        "lastName",
        "identificationNumber",
        "kraPin",
        "mobileNumber",
        "email",
      ],
      additionalProperties: false,
    },
    landDetails: {
      type: "object",
      properties: {
        landNo: {
          type: "string",
          maxLength: validationConstants.STRING_MAX_LENGTH,
          minLength: validationConstants.STRING_MIN_LENGTH,
        },
        longitude: { type: "string" },
        latitude: { type: "string" },
        subCountyId: { type: "string", pattern: UUID_PATTERN },
        wardId: { type: "string", pattern: UUID_PATTERN },
        currentUseId: {type: "string", pattern: UUID_PATTERN},
        newUseId: {type: "string", pattern: UUID_PATTERN},
      },
      required: ["landNo", "longitude", "latitude", "subCountyId", "wardId", "currentUseId", "newUseId"],
      additionalProperties: false,
    },
    documents: {
      type: "object",
      properties: {
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
    "personalDetails",
    "landDetails",
    "documents",
  ],
  additionalProperties: false,
};

const getLandParcelByLrnoValidation = {
  type: "object",
  properties: {
    lrno: {
      type: "string",
    },
  },
  required: ["lrno"],
  additionalProperties: false,
};


module.exports = {
  landParcelValidation,
  landParcelSearchValidation,
  landParcelQueryValidation,
  landListingValidation,
  landSubdivisionApplicationValidation,
  landUseChangeApplicationValidation,
  getLandParcelByLrnoValidation
};