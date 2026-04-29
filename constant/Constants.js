/**
 * Constants file
 * eg: "name":"nodeMode"
 */
const config = require('../lib/config')();
module.exports = {
  moduleFolderName: config.moduleFolderName,
  routeFolderName: config.routeFolderName,
  adminAuthIssuerName: "admin",
  routes: {
    login: "/login",
  }
};
