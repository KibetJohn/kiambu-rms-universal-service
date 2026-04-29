/**
 * @class
 * API Error class.
 */
class ApiError extends Error {
  /**
   * Constructor
   * @param {string} message error message
   */
  constructor(message, status, code) {
    super(message);
    this._status = status;
    this._code = code;
  }

  /**
   * Sends error JSON to response stream.
   * @param {Response} res Server response.
   */
  send(res) {
    // set status
    res.status(this._status || 500);

    // send JSON
    res.json({
      isError: true,
      code: this._code || "INTERNAL_ERROR",
      message: this.message
    });
  }
  /**
   * Returns error JSON.
   */
  get() {
    // return JSON
    return {
      isError: true,
      status: this._status || 500,
      code: this._code || "INTERNAL_ERROR",
      message: this.message
    };
  }
};

module.exports =  ApiError