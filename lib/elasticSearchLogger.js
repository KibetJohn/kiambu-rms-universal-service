const { createLogger, format, transports } = require("winston");
const { combine, timestamp, errors } = format;
const config = require('./config')();

// adds transport to winston,saves winston logs in filename.log
const elasticSearchlogger = createLogger({
  level: "info",
 format: combine(
    timestamp({
      format: 'DD-MM-YYYY HH:mm:ss'
    }),
    errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: config.elasticsearch_log_path}),
  ]
});

module.exports = elasticSearchlogger;
