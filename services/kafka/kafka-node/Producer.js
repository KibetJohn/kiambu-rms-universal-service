const kafka = require('kafka-node');
const config = require("./config.json")

/**
 * Produce message to kafka broaker.
 * @param {*} topic : Topic on which we need to produce message.
 * @param {*} message : message payload send to kakfa.
 */
const sendMessage = async (topic, message) => {
    let Producer = kafka.HighLevelProducer;
    let client = new kafka.KafkaClient({
        kafkaHost: `${config.kafka.BROKERS[0]},${config.kafka.BROKERS[1]},${config.kafka.BROKERS[2]}`
    });
    let producer = new Producer(client);
    let payloads = [
        { topic: topic, messages: JSON.stringify(message) }
    ]
    return new Promise((resolve, reject) => {
        producer.on('ready', function () {
            producer.send(payloads, function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });

        producer.on('error', function (err) {
            reject(err);
        })
    })
}


/**
*
*/
module.exports = { sendMessage }


