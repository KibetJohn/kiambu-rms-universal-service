const _ = require('lodash');
const path = require('path');

/**
 * Initialized flag.
 */
let IS_INIT = false;
let defaultPath, env, environmentConfigPath, CONFIG;
/**
 * Initialize module. This function should be called once before module usage.
 * 
 * @param {String} configDir - Absolute path to config directory.
 * @param {String} [env] - Optional environment name, defaults to NODE_ENV environment variable.
 */
function init(configDir) {

    const defaultFileName = "default.json";
    env = 'default';
    defaultPath = path.join(configDir, defaultFileName);
    const environment = process.env.NODE_ENV;
    if (!_.isNil(environment)) {
        env = environment;
        environmentConfigPath = path.join(configDir, `${environment}.json`)
    }
    IS_INIT = true;
}
/**
 * Read file from json
 * @param {*} jsonFile 
 */
function readJson(jsonFile) {
    return require(jsonFile);
}

function getConfig() {
    // must be initailized
    if (!IS_INIT) {
        throw new Error("Not initalized. Call getConfig.init() once at start.");
    }
    if (!CONFIG) {
        const config = readJson(defaultPath);
        if (environmentConfigPath) {
            _.merge(config, readJson(environmentConfigPath), process[env])
        }
        _.merge(config, process[env]);
        CONFIG = config
    }
    return CONFIG;
}
// add init() as a property to getConfig()
Object.defineProperty(getConfig, "init", { "value": init });

module.exports = getConfig;