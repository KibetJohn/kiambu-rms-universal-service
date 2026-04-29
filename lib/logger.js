const { format, createLogger, transports } = require('winston');
const  jsonStringify  =  require('fast-safe-stringify');
const { errors } = format;

const customFormat = {
  transform(info) {
    const { timestamp, label, message } = info;
    const level = info[Symbol.for('level')];
    const args = info[Symbol.for('splat')];
    const strArgs = args?.map(jsonStringify).join(' ');
    info[Symbol.for('message')] =
      `${timestamp} [${label}] ${level}: ${message} ${strArgs}`;
    return info;
  },
};

const logger = createLogger({
  level: "info",
  format: format.combine(
    errors({ stack: true }),
    format.timestamp({ format: 'DD-MM-YY HH:mm:ss' }),
    format.label({ label: 'pdsl-universal' }),
    customFormat,
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "log.log" })
  ],
});

module.exports = logger;
