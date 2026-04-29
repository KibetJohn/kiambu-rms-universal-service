const config = require("./config.json");
const winston = require("winston");
/**
 * Broaker handler for kafka.
 * @param {String} topic : Kafka topic name
 * @param {Object} message : Message payload.
 * @param {Number} partition : topic partition number. 
 */
module.exports = async (topic, message, partition) => {
    try {
        let data = JSON.parse(message)
        console.log(data);
        switch (topic) {
            case config.kafka.SMS_TOPIC:
                console.log("Message sending.........................................../n")
                break;
            case config.kafka.EMAIL_TOPIC:
                console.log("EMAIL_TOPIC sending.........................................../n")
                break;
            case config.kafka.APP_TOPIC:
                console.log("APP_TOPIC sending.........................................../n")
                break;
            case config.kafka.WHATSAPP_TOPIC:
                console.log("WHATSAPP_TOPIC sending.........................................../n")
                break;
            default:
                // do nothing
                break;
        }
    } catch (error) {
        winston.log('error', JSON.stringify(error));
    }
}