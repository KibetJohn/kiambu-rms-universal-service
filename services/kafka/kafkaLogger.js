const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json } = format;
// adds transport to winston,saves winston logs in filename.log
const kafkaLog = createLogger({
    format: combine(timestamp(),json()),
    transports: [
        new transports.Console({level: 'error' }),
        new transports.File({level: "info", filename: "kafka.log" })
    ]
});

module.exports = kafkaLog;
