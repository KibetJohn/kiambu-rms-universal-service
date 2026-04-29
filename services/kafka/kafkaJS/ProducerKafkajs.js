const { Kafka } = require('kafkajs');
const config = require("../config.json")

/**
 * Produce message to kafka broaker.
 * @param {*} topic : Topic on which we need to produce message.
 * @param {*} message : message payload send to kakfa.
 */
const sendMessage = async (topic, message) => {
    try {
        const kafka = new Kafka({
            clientId: config.kafka.CLIENTID,
            brokers: [config.kafka.BROKERS[0], config.kafka.BROKERS[1], config.kafka.BROKERS[2]]
        });
        let producer = kafka.producer();
        await producer.connect();
        await producer
            .send({
                topic,
                messages: [{value:JSON.stringify(message)}]
            })
    } catch (e) {
        console.error(`${e.message}`, e)
    }
}


/**
*
*/
module.exports = { sendMessage }