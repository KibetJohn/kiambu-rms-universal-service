const vault = require("../lib/vault");
const _ = require("lodash");

function initVault() {
  const v = new vault("./keystore.bcup", process.env.VAULT_PWD);
  return v.init().then(() => {
    process["default"] = v.generateJson("default");
    if (process.env.NODE_ENV) {
      process[process.env.NODE_ENV] = v.generateJson(process.env.NODE_ENV);
      console.log(" process[process.env.NODE_ENV",  process[process.env.NODE_ENV])
    }
  });
}

module.exports = initVault;
