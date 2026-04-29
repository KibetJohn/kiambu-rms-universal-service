require('module-alias/register');
let app;
async function init() {
  require('./startup/initializeVaultEnv')()
    .then( async () => {
      // Npm Modules
      const express = require("express");
      const path = require("path");
      const cors = require("cors");
      const http = require("http");
      require("dotenv");
    
      //Load and init config file.
      const configPath = path.join(__dirname, 'config');
      require('./lib/config').init(configPath);
      //Local Modules
      const routes = require("./routes");
      const errorHandler = require("./lib/errorHandler");
      const jsonParser = require("./lib/jsonParser");
      const logger = require("./lib/logger");
      const routeVersioning = require('./lib/routeVersioning');
      const logging = require('./lib/logAPI');
      const knex = require("./lib/knex");
      const Constants = require("./constant/Constants");
      const config = require('./lib/config')();
      const { healthCheckController } = require('./modules/healthCheck/healthCheckController');

    
      // create app instance
      app = express();
      //enable cors
      app.use(cors({ exposedHeaders: ["Authorization"] }));
      // json parsing
      app.use(jsonParser());
      app.use(express.urlencoded({ extended: true }));
    
      // Connect to database
      knex.migrate
        .latest()
        .then(() => console.log("migration successful"))
        .catch((err) => console.log({ err }));

      // Api documentation
      app.use("/api/universal/services/docs", express.static(__dirname + "/doc"));

      // Healthcheck API to check service and db status
      app.use('/api/universal/healthcheck', healthCheckController);

      app.use(routeVersioning);

      //logg
      app.use(logging);
    
      // auth check
      const modulePath = path.join(__dirname, Constants.moduleFolderName);
      await routes(app, Constants.routeFolderName, modulePath);
      // error handling
      app.use(errorHandler);
      
      // start listening
      const host = config.host;
      const port = config.port;
    
      // Create http server
      const server = http.createServer(app);

      server.listen(port, () => logger.info(`app online @ ${host}:${port}`));
    });
}

// run app
init().catch(e => {
  throw e;
});

module.exports.app = app;
