const { enums } = require("../../../constant/enumConstants");

const masterDatalicenseAndPermitValidation = {
  type: "object",
  properties: {
    limit: { type: "string", multipleOf: 1 },
    page: { type: "string", multipleOf: 1 },
    search: { type: "string", transform: enums.TRANSFORM_ENUM },
    orderBy: { type: "string", enum: ["asc", "desc"] },
  },
  additionalProperties: false,
};

module.exports = masterDatalicenseAndPermitValidation;
