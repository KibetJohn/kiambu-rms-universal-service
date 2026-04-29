const ApiError = require("./ApiError");
const errors = require("./errors");
const logger = require("../lib/logger");
const _ = require("lodash");

/**
 * Express error handler middleware.
 * Should be the last middleware used.
 *
 * @param {Error|*} err Error value
 * @param {Request} req Express request
 * @param {Response} res Express response
 * @param {Function} next Next function
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    // end if headers have already been sent
    res.end();
  } else {
    // send error
    if (err instanceof ApiError) {
      // send API error
      err.send(res);
    } else {
      // log intrnal error
      logger.error(err);

      // send default API error
      let details = inspectDetail(err);
      errors.INTERNAL(details).send(res);
    }
  }
}
/**
 * Inspect err object and return related error detail if any.
 *
 * @param {*} err - error to inspect.
 * @return {Object} error details, or undefined.
 */
function inspectDetail(err) {
  // native mongo driver errors, forwarded by mongoose
  if (err instanceof Error && err.name === "MongoError" && err.driver) {
    switch (err.code) {
      case 11000: // unique index conflict
        return "Document already exists.";
    }
  }

  // mongoose errors
  if ("MongooseError" === _.get(err, "constructor.name")) {
    const details = [];
    switch (err.name) {
      case "ValidationError": // schema validation failed
        extractMongooseValidationDetails(details, err.errors);
        return JSON.stringify(details);
    }
  }

  // generic errors
  if (
    (err instanceof Error || _.has(err, "message")) &&
    _.has(err, "message")
  ) {
    return err.message;
  }

  // return default detail
  return "Unknown Error";
}
/**
 * Extract mongoose validation error tree to flat array.
 *
 * @param {Array} details - array to populate. Empty array for start.
 * @param {Object} errors - mongoose errors object.
 */
function extractMongooseValidationDetails(details, error) {
  // log path and message if exist
  if (_.isString(error.path) && _.isString(error.message)) {
    details.push({ path: error.path, message: error.message });
  }

  // recurse
  _.forOwn(error, e => {
    if ("MongooseError" === _.get(e, "constructor.name")) {
      extractMongooseValidationDetails(details, e);
    }
  });
}

module.exports = errorHandler;
