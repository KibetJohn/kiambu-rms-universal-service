const { enums } = require("../../../constant/enumConstants");
const { validationConstants } = require("../../../constant/validationConstants");
const { UUID_PATTERN, INTEGER_PATTERN } = require("../../../util/regex");

const addMasterDataLandUseValidation = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    status: {
      type: "boolean",
      enum: enums.BOOLEAN_ENUM,
    },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
  },
  required: [
    "name",
    "status",
    "serviceId",
  ],
  additionalProperties: false,
};

const getMasterDataLandUseValidation = {
  type: "object",
  properties: {
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["serviceId"],
  additionalProperties: false,
};

const getMasterDataLandUseQueryValidation = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    limit: { type: "string", pattern: INTEGER_PATTERN },
    page: { type: "string", pattern: INTEGER_PATTERN },
  },
  required: ["limit", "page"],
  additionalProperties: false,
};

const updateLandUseValidation = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    status: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["name", "status", "serviceId"],
  additionalProperties: false,
};

const landUseParamValidation = {
  type: "object",
  properties: {
    id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["id"],
  additionalProperties: false,
};

const landUseQueryValidation = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["true", "false"],
    },
    serviceId: { type: "string", pattern: UUID_PATTERN },
  },
  additionalProperties: false,
};

module.exports = {
  addMasterDataLandUseValidation,
  getMasterDataLandUseValidation,
  getMasterDataLandUseQueryValidation,
  updateLandUseValidation,
  landUseParamValidation,
  landUseQueryValidation
};