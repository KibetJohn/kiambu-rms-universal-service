const { UUID_PATTERN, INTEGER_PATTERN, DECIMAL_PATTERN } = require("../../../util/regex");

const landZoneQueryValidation = {
  type: "object",
  properties: {
    isActive: {
      type: "string",
      enum: ["true", "false"],
    },
  },
  additionalProperties: false,
};

const subcountyZoneBodyValidation = {
  type: "object",
  properties: {
    landZoneId: {
      type: "string",
      pattern: UUID_PATTERN
    },
    subCounties: {
      type: "array",
      items: {
        type: "string",
        pattern: UUID_PATTERN
      },
    },
    usvValueId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    value: {
      type: "string",
      pattern: DECIMAL_PATTERN,
    },
  },
  required: ["landZoneId", "subCounties", "usvValueId", "value"],
  additionalProperties: false,
};

const getZoneDataQueryValidation = {
  type: "object",
  properties: {
    limit: { type: "string", pattern: INTEGER_PATTERN },
    page: { type: "string", pattern: INTEGER_PATTERN },
  },
  required: ["limit", "page"],
  additionalProperties: false,
};

const subcountyZoneParamValidation = {
  type: "object",
  properties: {
    id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["id"],
  additionalProperties: false,
};

module.exports = {
  landZoneQueryValidation,
  subcountyZoneBodyValidation,
  getZoneDataQueryValidation,
  subcountyZoneParamValidation,
};