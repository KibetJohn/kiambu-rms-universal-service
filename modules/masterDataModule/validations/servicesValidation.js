const appConstants = require("../../../constant/appConstants");
const { UUID_PATTERN } = require("../../../util/regex");

const servicesQueryValidation = {
  type: "object",
  properties: {
    isActive: {
      type: "string",
      enum: ["true", "false"],
    },
    module: {
      type: "string",
      enum: [
        appConstants.SERVICE_MODULE.LICENSE_PERMIT,
        appConstants.SERVICE_MODULE.LAND_RENT_AND_RATES,
        appConstants.SERVICE_MODULE.PUBLIC_HEALTH,
      ],
    },
  },
  additionalProperties: false,
};

const serviceNameParamsValidation = {
  type: "object",
  properties: {
    id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["id"],
  additionalProperties: false,
};

module.exports = {
  servicesQueryValidation,
  serviceNameParamsValidation
};
