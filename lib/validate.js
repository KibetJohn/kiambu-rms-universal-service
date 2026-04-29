const _ = require("lodash");
const Ajv = require("ajv");
const errors = require("./errors");
const addFormats = require("ajv-formats");
const { toSentenceCase } = require("./helper");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
require("ajv-errors")(ajv);
require("ajv-keywords")(ajv, "transform");

/**
 * Validate data against schema.
 * Throws API error if data is invalid.
 *
 * @param {*} data data to validate.
 * @param {object} schema json schema object.
 */
module.exports = function (schema, toValidate = null) {
  return (req, res, next) => {
    //validate
    const validator = ajv.compile(schema);

    // to store the validation status on schema
    let isValid;

    switch (toValidate) {
      case "PARAMS": // validate req params
        isValid = validator(req.params);
        break;

      case "QUERY_STRING": // validate req query params
        isValid = validator(req.query);
        break;

      default: //validate req body
        isValid = validator(req.body);
    }

    // proceed if valid
    if (isValid) {
      return next();
    }
    // extract error message
    let message;
    if (validator.errors.length && _.has(validator.errors[0], "dataPath")) {
      message = `${validator.errors[0].message} at ${validator.errors[0].dataPath}`;
    } else {
      message =
        toSentenceCase(validator.errors[0].instancePath) +
        " " +
        toSentenceCase(validator.errors[0].message);
    }

    // send validation error with message
    throw errors.INVALID_INPUT(message);
  };
};
