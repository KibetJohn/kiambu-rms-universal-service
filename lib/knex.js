const environment = process.env.NODE_ENV || "development";
const config = require("../startup/ConnectDB")[environment];
module.exports = require("knex")(config);
