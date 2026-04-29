const _ = require("lodash");
const knex = require("../../lib/knex");
const { errorConstants } = require("../../constant/errorConstants");

const healthCheckController = async (req, res, next) => {
  try {
    const serviceCheck = await knex("services").select("name").limit(1);
    if (_.isEmpty(serviceCheck)) {
      throw Error(errorConstants.DATABASE_CONNECTION_FAILED);
    } else {
      res.json({
        success: true,
      });
    }
  } catch (error) {
    next(new Error(errorConstants.DATABASE_CONNECTION_FAILED));
  }
};

module.exports = {
  healthCheckController,
};