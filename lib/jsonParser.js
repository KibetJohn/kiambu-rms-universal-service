"use strict";
const bodyParser = require("body-parser");
const errors = require("./errors");

/**
 * Wraps "body-parser.json()" middleware.
 * Detects JSON parsing errors and forwards these as ApiError instances.
 *
 * @param {Object} options body-parser options.
 * @returns {Function} wrapped middleware.
 */
module.exports = options => {
  // create json parsing middeware with given options
  const mw = bodyParser.json(options);

  // return wrapped middleware
  return (req, res, next) => {
    // intercept errors from body-parser
    const handler = err => {
      if (err && err.status && err.status === 400) {
        // parsing error
        next(errors.INVALID_INPUT());
      } else {
        // some other error
        next(err);
      }
    };

    // call parsing middleware, with interceptor
    mw(req, res, handler);
  };
};