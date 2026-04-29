const amqp = require("amqplib");
const config = require("./config")();
const { host, user, password } = config.RABBIT_MQ;

let connection = null;
let channel = null;
let isConnecting = false;

const init = async (queue) => {
  if (connection || isConnecting) return;

  try {
    isConnecting = true;

    connection = await amqp.connect(`amqps://${user}:${password}@${host}`);

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed");
      connection = null;
      channel = null;
    });

    channel = await connection.createConfirmChannel();

    await channel.assertQueue(queue, { durable: true });

    console.log("RabbitMQ initialized");
  } catch (err) {
    console.error("RabbitMQ init failed:", err);
    connection = null;
    channel = null;
  } finally {
    isConnecting = false;
  }
};

const sendNotification = async (msg, queue) => {
  try {
    if (!channel) {
      await init(queue);
    }

    if (!channel) {
      throw new Error("Channel not available");
    }

    return new Promise((resolve, reject) => {
      const ok = channel.sendToQueue(
        queue,
        Buffer.from(msg),
        { persistent: true },
        (err) => {
          if (err) {
            console.error("Message publish failed:", err);
            return reject(err);
          }
          resolve(true);
        }
      );

      // Handle backpressure
      if (!ok) {
        channel.once("drain", () => {
          console.log("RabbitMQ buffer drained");
        });
      }
    });
  } catch (error) {
    console.error("sendNotification error:", error);
  }
};

module.exports = { sendNotification };
