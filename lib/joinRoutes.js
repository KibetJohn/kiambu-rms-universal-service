const glob = require("glob");
const util = require("util");
const fs = require("fs");
const _ = require('lodash');
/**
 * Mount the routes for each file in the  routeFolderName folder, It should be parellel to root folder.
 * @param {String} routeFolderName - Folder where all the routes are exists
 * @param {String} rootDir - Root folder name.
 */
async function readRoutes(modulePath, routeFolderName) {
  if (!modulePath || !fs.existsSync(modulePath)) {
    throw new Error("Invalid module path.");
  }
  let options = { cwd: modulePath, realpath: true };
  let pattern = `**/${routeFolderName}/**/*.js`;

  try {   
    const promisifyGlob = util.promisify(glob);
    const files = await promisifyGlob(pattern, options);
    return files;
  } catch (error) {
    throw new Error("Invalid route folder path");
  }
}

/**
 *
 * @param {*} app - Express instance
 * @param {*} rootDir - Root directory path
 * @returns {Promise} - router
 */
async function joinRoutes(modulePath, routeFolderName, app) {
  let routes = await readRoutes(modulePath, routeFolderName);
  routes.forEach(routePath => {
    let route = require(routePath);
    const isArray = _.isArray(route);
    if (route) {
      // Mount Routes.
      if (isArray) {
        route.forEach( ele => ele(app) )
      } else {
        route(app);
      }
    } else {
      throw new Error(`Invalid route folder path ${routePath}`);
    }
  });
}

module.exports = joinRoutes;
