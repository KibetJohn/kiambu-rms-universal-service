const kafka = require('kafka-node');
const kafkaLogger = require('../kafkaLogger');
const config = require("../config.json");
const handler = require("../consumerHandler");
/**
 * Consumer client for Kafka server.
 */
module.exports = () => {
  try {
    const client = new kafka.KafkaClient({ kafkaHost: `${config.kafka.BROKERS[0]},${config.kafka.BROKERS[1]},${config.kafka.BROKERS[2]}` });
    const topics = [
      { topic: config.kafka.SMS_TOPIC },
      { topic: config.kafka.EMAIL_TOPIC },
      { topic: config.kafka.APP_TOPIC },
      { topic: config.kafka.WHATSAPP_TOPIC }
    ]
    const options = {
      autoCommit: false,
      groupId: config.kafka.GROUPID,
      fetchMaxWaitMs: 1000,
      fetchMaxBytes: 1024 * 1024,
      encoding: 'utf8'
    }

    // Message handler
    const _messageHandler = async (message) => {
      // message contains -> highWaterOffset, offset, partition, topic, value
      const { topic, value, partition, offset } = message;
      try {

        kafkaLogger.log('info', `PRE:Consumer: ${topic}:  ${partition} Message received from topic ${topic} partition ${partition} offset ${offset} `);
        console.log('info', `PRE: Consumer: ${topic}: ${partition} Message received from topic ${topic} partition ${partition} offset ${offset} `);
        await handler(topic, value, partition);
        consumer.commit(_commitHandler)
        kafkaLogger.log('info', `POST: Consumer partition ${topic}: ${partition}, received from topic ${topic} partition ${partition} offset ${offset} `);
      } catch (error) {
        kafkaLogger.error("error", `ERROR: Message received from topic ${topic} partition ${partition} offset ${offset}  error:  ${error}`);
      }
    }

    // Error handler
    const _errorHandler = (error) => {
      kafkaLogger.log('error: ', JSON.stringify(error));
    }

    //  Commit handler
    const _commitHandler = (error, data) => {
      if (error) {
        kafkaLogger.error('error', JSON.stringify(error));
      }
    }
    const Consumer = kafka.Consumer;
    const consumer = new Consumer(client, topics, options);
    consumer.on('message', _messageHandler);
    consumer.on('error', _errorHandler);

  } catch (error) {
    kafkaLogger.log("error", JSON.stringify(error))
  }
}




