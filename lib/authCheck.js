const _ = require("lodash");
const asyncback = require("asyncback");
const util = require("util");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const mm = require("micromatch");

// local modules
const config = require("../lib/config")();
const errors = require("./errors");
const { errorConstants } = require("../constant/errorConstants");
// white list url patterns
const AUTH_WHITE_LIST = [];
const ROUTE_LIST = [];

const routeValidator = (req, res) => {
  if (mm.any(req.path, ROUTE_LIST)) {
    //logging public route user activity
    throw errors.NOT_FOUND();
  } else {
    return;
  }
}

async function routeCheck(app, routeList) {
  let patterns = _.map(routeList, _.toString);
  patterns = _.uniq(patterns);
  _.each(patterns, p => ROUTE_LIST.push(p));

  app.use(asyncback( routeValidator ));
}



/**
 * Perform auth toke check, adds user to request on success
 * @param {Request} req request
 * @param {Response} res response
 */
async function authorize(req, res) {
  // skip if request matches white listed patterns
  if (mm.any(req.path, AUTH_WHITE_LIST)) {
    //logging public route user activity
    return;
  }

  // get auth token
  const token = req.get("Authorization") || req.query["authToken"];

  // auth token must be supplied
  if (_.isNil(token) || token.length < 1) {
    throw errors.UNAUTHORIZED("Auth token is required.");
  }

  // verify auth signature
  const decodedToken = await authToken.verifyAuthToken(token);
  const userInfo = decodedToken["data"];

  // get user
  const user = await userCache.get(userInfo.userId);

  //user not found
  if (!user) {
    throw errors.UNAUTHORIZED("Auth token is invalid or expired");
  }

  // set as request property
  _.set(req, "user", user);

  // add role field to valdiate acl
  _.set(req, "user.aclRole", user.role[0]);

  //acl
  const promisedAcl = util.promisify(acl.authorize);
  //check for acl rules for given role
  await promisedAcl(req, res);

  //check user's force login timestamp
  if (
    _.isFinite(_.toNumber(user.forceLoginTimestamp)) &&
    _.toNumber(user.forceLoginTimestamp) > userInfo.createdAt
  ) {
    throw errors.UNAUTHORIZED("Auth token is invalid or expired");
  }
  //logging user activity
}

/**
 * Refresh the auth token.
 * @param {*} oldAuthToken - old auth token
 * @param {String} issuer - issuer name
 * @param {string} expiresIn - expiresIn value and must be in jwt's expiresIn value format.
 * @returns resolve promise with new authtoken.
 */
async function refreshAuthToken(oldAuthToken, issuer, expiresIn) {
  const decodedToken = await verifyAuthToken(oldAuthToken, issuer);
  const data = decodedToken.data;
  const userId = data.userId;
  const modelName = data.userType;
  return generateToken(userId, modelName, issuer, expiresIn);
}

/**
 * @param authToken - user's auth token
 * @param {String} issuer - issuer name
 * @returns decoded token promise
 * @throws INVALID_AUTH error
 */
async function verifyAuthToken(authToken, issuer) {
  const verify = util.promisify(jwt.verify),
    authSecret = config.authTokenSecret;
  try {
    return await verify(authToken, authSecret, { issuer: issuer });
  } catch (e) {
    const detail =
      e.name == "TokenExpiredError"
        ? errorConstants.TOKEN_IS_EXPIRED
        : errorConstants.AUTH_TOKEN_IS_INVALID;
    throw errors.UNAUTHORIZED(detail);
  }
}

/**
 * Enables auth checking.
 * @param {express} app  express app
 * @param {string[]} [whiteList] array of white listed url patterns (see micromatch npm module)
 */
function authCheck(app, whiteList = []) {
  // save white list
  let patterns = _.map(whiteList, _.toString);
  patterns = _.uniq(patterns);
  _.each(patterns, p => AUTH_WHITE_LIST.push(p));

  // add middleware
  app.use(asyncback(authorize));
}


module.exports = {
  authCheck: authCheck,
  verifyAuthToken: verifyAuthToken,
  refreshAuthToken: refreshAuthToken,
  routeCheck
};
