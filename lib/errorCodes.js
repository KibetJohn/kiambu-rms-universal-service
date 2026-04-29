/**
 * Defined API errors.
 */
module.exports = {
  VERSION_MISMATCH: {
    code: 'VERSION_MISMATCH',
    status: 400,
    message: 'API version mismatch',
  },
  VERSION_HEADER_NOT_FOUND: {
    code: 'VERSION_HEADER_NOT_FOUND',
    status: 404,
    message: 'accept-version header not found',
  },
  INTERNAL: {
    code: "INTERNAL",
    status: 500,
    message: "Internal server error."
  },
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    status: 401,
    message: "Unauthorized access."
  },
  NOT_IMPLEMENTED: {
    code: "NOT_IMPLEMENTED",
    status: 501,
    message: "Resource method not implemented."
  },
  INVALID_INPUT: {
    code: "INVALID_INPUT",
    status: 400,
    message: "Invalid input in request."
  },
  INVALID_INPUT_FORMAT: {
    code: "INVALID_INPUT_FORMAT",
    status: 400,
    message: "Invalid input in format."
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    status: 404,
    message: "No such resource exists."
  },
  NOT_ALLOWED: {
    code: "NOT_ALLOWED",
    status: 403,
    message: "Operation not allowed."
  },
  NO_ACCESS: {
    code: "NO_ACCESS",
    status: 403,
    message: "Access not allowed."
  },
  INVALID_KEY: {
    code: "INVALID_KEY",
    status: 401,
    message:
      "Valid api key is required. Please provide a valid api key along with request."
  },
  INVALID_LOGIN: {
    code: "INVALID_LOGIN",
    status: 401,
    message: "Login credentials do not match any registered user."
  },
  INCORRECT_PASSWORD: {
    code: "INCORRECT_PASSWORD",
    status: 401,
    message: "Email or Password is incorrect.",
  },
  ALREADY_EXISTS: {
    code: "ALREADY_EXISTS",
    status: 409,
    message: "Data Already exists.",
  },
  CONFLICT: {
    code: "CONFLICT",
    status: 409,
    message: "Resource conflict.",
  },
};
