const { Credentials, FileDatasource, Vault, init } = require("buttercup");
init();
const fs = require("fs");
class vault {
  constructor(keyStoreFilePath, password) {
    this.keyStoreFilePath = keyStoreFilePath;
    this.password = password;
  }

  async init() {
    this.vaultInstance = await this._createOrGetStore(this.keyStoreFilePath);
  }

  async saveUpdateCreds(creds, groupName) {
    this._add(
      creds,
      this.getGroup(this.vaultInstance, groupName) ||
        this.vaultInstance.createGroup(groupName)
    );
    return this._saveStore();
  }

  dcryptFile() {
    return Credentials.fromDatasource(
      {
        path: this.keyStoreFilePath,
      },
      this.password
    );
  }

  getGroup(group, groupName) {
    return group.findGroupsByTitle(groupName)[0];
  }

  deleteGroup(jsonPath) {
    let groupToDelete;
    jsonPath.forEach((value) => {
      groupToDelete = this.getGroup(groupToDelete || this.vaultInstance, value);
      if (!groupToDelete) {
        throw Error("Group Not Found", value);
      }
    });
    groupToDelete.getEntries()[0].delete();
    groupToDelete.delete();
    return this._saveStore();
  }

  deleteProperty(jsonPath, properties) {
    let group;
    jsonPath.forEach((value) => {
      group = this.getGroup(group || this.vaultInstance, value);
      if (!group) {
        throw Error("Group Not Found", value);
      }
    });
    const entries = group.getEntries()[0];
    properties.forEach((property) => {
      entries.deleteProperty(property);
    });

    if (Object.keys(entries.getProperties()).length == 1) {
      this.deleteGroup(jsonPath);
    }
    return this._saveStore();
  }

  readCredentialsFile() {
    return new FileDatasource(this.dcryptFile())
      .load(Credentials.fromPassword(this.password))
      .then((vaultInstance) => Vault.createFromHistory(vaultInstance.history));
  }

  generateJson(groupName) {
    const base = {};
    this._generateJson(this.getGroup(this.vaultInstance, groupName), base);
    return base;
  }

  _generateJson(group, output) {
    const entries = group.getEntries();
    const childGroups = group.getGroups();
    if (entries.length) {
      entries.forEach((entry) => {
        for (let [key, value] of Object.entries(entry.getProperties())) {
          if (key !== "title") {
            try {
              output[key] = JSON.parse(value);
            } catch (error) {
              output[key] = value;
            }
          }
        }
      });
    }
    if (childGroups.length) {
      childGroups.forEach((childGroup) => {
        this._generateJson(childGroup, (output[childGroup.getTitle()] = {}));
      });
    }
  }

  _createStore() {
    return Vault.createWithDefaults();
  }

  _saveStore() {
    return new FileDatasource(this.dcryptFile()).save(
      this.vaultInstance.format.history,
      Credentials.fromPassword(this.password)
    );
  }

  _add(creds, group) {
    let entry = group.getEntries()[0];
    for (let [key, value] of Object.entries(creds)) {
      if (value instanceof Array) {
        if (!entry) {
          entry = group.createEntry("My Bank");
        }
        entry.setProperty(key, JSON.stringify(value));
      } else if (value instanceof Object) {
        this._add(value, this.getGroup(group, key) || group.createGroup(key));
      } else {
        if (!entry) {
          entry = group.createEntry("My Bank");
        }
        entry.setProperty(key, value);
      }
    }
  }

  async _createOrGetStore() {
    if (fs.existsSync(this.keyStoreFilePath)) {
      return this.readCredentialsFile();
    } else {
      return this._createStore();
    }
  }
}

// const v = new vault('./keystore.bcup', '!Summer@20');
// v.init().then(() => {

//     v.saveUpdateCreds({
//         database: {
//             CLIENT: 'postgresql',
//             PG_USER: 'postgres',
//             PASSWORD: 'hrhk',
//             DATABASE: 'pdsl_universal',
//             HOST: '127.0.0.1',
//             PG_PORT: '5432'
//           },
//     }, 'default');

//     // v.deleteGroup(['test1', 'test2'])

//     // v.deleteProperty(['test1', 'test2'], ['property1'])

//     v.generateJson('default') //like: 'development', 'stage', 'production'
// })

module.exports = vault;
