// Update with your config settings.
const config = require("../lib/config")();
const { CLIENT, DATABASE, PG_USER, PASSWORD, HOST, PG_PORT } = config.database;

module.exports = {
  development: {
    client: CLIENT,
    connection: {
      database: DATABASE,
      user: PG_USER,
      password: PASSWORD,
      host: HOST,
      port: PG_PORT,
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    },
    migrations: {
      directory: __dirname.replace("/startup", "") + "/db/migrations",
    },
    seeds: {
      directory: __dirname.replace("/startup", "") + "/db/seeds",
    },
  },

  staging: {
    client: CLIENT,
    connection: {
      database: DATABASE,
      user: PG_USER,
      password: PASSWORD,
      host: HOST,
      port: PG_PORT,
    },
    migrations: {
      directory: __dirname.replace("/startup", "") + "/db/migrations",
    },
    seeds: {
      directory: __dirname.replace("/startup", "") + "/db/seeds",
    },
  },

  qa_release: {
    client: CLIENT,
    connection: {
      database: DATABASE,
      user: PG_USER,
      password: PASSWORD,
      host: HOST,
      port: PG_PORT,
    },
    migrations: {
      directory: __dirname.replace("/startup", "") + "/db/migrations",
    },
    seeds: {
      directory: __dirname.replace("/startup", "") + "/db/seeds",
    },
  },

  production: {
    client: CLIENT,
    connection: {
      database: DATABASE,
      user: PG_USER,
      password: PASSWORD,
      host: HOST,
      port: PG_PORT,
    },
    migrations: {
      directory: __dirname.replace("/startup", "") + "/db/migrations",
    },
    seeds: {
      directory: __dirname.replace("/startup", "") + "/db/seeds",
    },
  },

  onUpdateTrigger: (table) => `
  CREATE TRIGGER ${table}_updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE PROCEDURE on_update_timestamp();
`,
};
