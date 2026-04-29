const { enums } = require("../../../constant/enumConstants");

const paymentModeValidation = {
  type: "object",
  properties: {
    payment_mode: {
      type: "string",
      nullable: false,
      enum: enums.PAYMENT_MODES,
    },
  },
  additionalProperties: false,
};

module.exports = { paymentModeValidation };
