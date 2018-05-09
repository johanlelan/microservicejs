const debug = require('debug')('messaging');
const amqp = require('amqplib');

exports.connect = (err) => {
  if (err && err.message !== 'Connection closing') {
    debug('[AMQP] conn error', err.message);
    return setTimeout(exports.connect, 1000);
  }
  return amqp.connect(process.env.AMQP_URL || 'amqp://localhost:5672')
    .then((bus) => {
      const channel = bus.createChannel();
      channel.isConnected = true;
    })
    .catch(exports.connect);
};
