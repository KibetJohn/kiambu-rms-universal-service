const _ = require('lodash');
const { Kafka } = require('kafkajs');
const winston = require('winston');
const config = require("../config.json");
const handler = require("../consumerHandler");
const kafkaLogger = require('../kafkaLogger');
/**
 * Consumer client for Kafka server.
 */
module.exports = async (consumerId) => {
  this.consumerId = consumerId
  try {
    const kafka = new Kafka({
      clientId: config.kafka.CLIENTID,
      brokers: [config.kafka.BROKERS[0], config.kafka.BROKERS[1], config.kafka.BROKERS[2]]
    });


    // Message handler
    const _messageHandler = async (message) => {
      try {
        // message contains -> highWaterOffset, offset, partition, topic, value,fetchedOffset
        const { topic, value, partition, offset } = message;
        kafkaLogger.log('info', `PRE: Consumer: ${this.consumerId} Message received from topic ${topic} partition ${partition} offset ${offset} value ${value}`);
        await handler(topic, value, partition);
      } catch (error) {
        winston.error(error);
      }
    }
    const options = {
      autoCommit: false,
      groupId: config.kafka.GROUPID,
      fetchMaxWaitMs: 1000,
      fetchMaxBytes: 1024 * 1024,
      encoding: 'utf8'
    }
    const consumer = kafka.consumer(options)
    await consumer.connect()
    await consumer.subscribe({ topic: config.kafka.SMS_TOPIC, fromBeginning: true })
    await consumer.subscribe({ topic: config.kafka.EMAIL_TOPIC, fromBeginning: true })
    await consumer.subscribe({ topic: config.kafka.APP_TOPIC, fromBeginning: true })
    await consumer.subscribe({ topic: config.kafka.WHATSAPP_TOPIC, fromBeginning: true })
    await consumer.run({
      eachBatchAutoResolve: true,
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        // Fetch in batches, define batch size in second parameter.
        for (let chunk of _.chunk(batch.messages, config.kafka.batchSize)) {
          if (!isRunning()) break
          // iterate over chunks of messages.
          for (let message of chunk) {
            if (!isRunning() || isStale()) break

            let payloads = {
              topic: batch.topic,
              value: message.value.toString(),
              partition: batch.partition,
              offset: message.offset,
              highWaterOffset: batch.highWatermark,
              fetchedOffset: batch.fetchedOffset
            }
            console.log(`Consumer: Message got from Topic: ${batch.topic} part ${batch.partition} offset: ${message.offset}`)
            try {
              await _messageHandler(payloads)
              resolveOffset(message.offset)
              await heartbeat()
            } catch (error) {
              resolveOffset(message.offset)
            }
          }
        }
      }
    })
  } catch (error) {
    winston.log('error', JSON.stringify(error))
  }
}




