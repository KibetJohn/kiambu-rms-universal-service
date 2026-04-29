const amqp = require("amqplib/callback_api");
const config = require("./config")();
const { host, user, password } = config.RABBIT_MQ;

const sendNotification = async (msg, queue) => {
  try {
    const opt = {
      credentials: require("amqplib").credentials.plain(
        `${user}`,
        `${password}`
      ),
      frameMax: 131072,
    }; // options
    amqp.connect(`amqps://${host}`, opt, function (error0, connection) {
      if (error0) {
        throw error0;
      }

      connection.createChannel(function (error1, channel) {
        if (error1) {
          throw error1;
        }

        channel.assertQueue(queue, {
          durable: true,
        });
        channel.sendToQueue(queue, Buffer.from(msg), {
          persistent: true,
        });
        console.log(" [x] Sent '%s'", msg);
      });
      setTimeout(function () {
        connection.close();
      }, 500);
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  sendNotification,
};
