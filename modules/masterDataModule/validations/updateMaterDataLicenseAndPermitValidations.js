const { UUID_PATTERN } = require("../../../util/regex");

const updateMasterDataLicenseAndPermitParamsValidation = {
  type: "object",
  properties: {
    id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["id"],
  additionalProperties: false,
};

module.exports = {
  updateMasterDataLicenseAndPermitParamsValidation,
};
