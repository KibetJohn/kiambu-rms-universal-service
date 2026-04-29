const _ = require("lodash");
const asyncback = require("asyncback");

/**
 * Mounts async handler on app for given method at given path.
 * @param {string} method HTTP method
 * @param {string} path route path
 * @param {function} handler handler async function
 * @param {express} app express/router instance
 */
function mount(method, path, middlewares, handler, app) {
  let p = '/api/universal' + path;
  app[method](p, middlewares, asyncback(handler));
}

// supported HTTP methods
const methods = ["get", "put", "post", "delete"];

// add route methods to exports
_.each(methods, m => {
  module.exports[m] = (path, middlewares, handler) =>
    _.partial(mount, m, path, middlewares, handler);
});
