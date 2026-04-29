const kafka = require('kafka-node');
const kafkaLogger = require('./kafkaLogger');
const config = require("./config.json");
const handler = require("./consumerHandler");
/**
 * Consumer client for Kafka server.
 */
module.exports = () => {

  try {
    // Message handler
    const _messageHandler = async (message) => {
      // message contains -> highWaterOffset, offset, partition, topic, value
      const { topic, value, partition, offset } = message;
      try {

        kafkaLogger.log('info', `PRE:  ${partition} Message received from topic ${topic} partition ${partition} offset ${offset} `);
        console.log('info', `PRE: ${partition} Message received from topic ${topic} partition ${partition} offset ${offset} `);
        await handler(topic, value, partition);
        kafkaLogger.log('info', `POST:  partition ${partition}, received from topic ${topic} partition ${partition} offset ${offset} `);
      } catch (error) {
        kafkaLogger.error("error", `ERROR: Message received from topic ${topic} partition ${partition} offset ${offset}  error:  ${error}`);
      }
    }

    // Error handler
    const _errorHandler = (error) => {
      kafkaLogger.log('error: ', JSON.stringify(error));
    }
    const consumer_group_options = {
      kafkaHost: `${config.kafka.BROKERS[0]},${config.kafka.BROKERS[1]},${config.kafka.BROKERS[2]}`,
      groupId: config.kafka.GROUPID,
      sessionTimeout: 15000,
      protocol: ['roundrobin'],
      fromOffset: 'latest'
    }
    let customConsumerGroupName = config.kafka.GROUP_NAME;
   
    const topics = [config.kafka.SMS_TOPIC, config.kafka.EMAIL_TOPIC, config.kafka.APP_TOPIC, config.kafka.WHATSAPP_TOPIC]
    const ConsumerGroup = new  kafka.ConsumerGroup(consumer_group_options, topics);
    ConsumerGroup.on('connect', (resp) => {
      console.log(`${customConsumerGroupName} is connected!`);
    });
    ConsumerGroup.on('message', _messageHandler);
    ConsumerGroup.on('error', _errorHandler);


  } catch (error) {
    kafkaLogger.log("error", JSON.stringify(error))
  }
}




