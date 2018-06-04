const debug = require('debug')('messaging');

const queue = 'demandes-financement';

exports.create = (amqp) => {
  const propagateEvents = (publisher, channel, logger) => Promise.all([
    channel.assertQueue(`${queue}.out`, { durable: true, autoDelete: false })
      .then(() => {
        publisher.onAny((event) => {
          logger.info(`Propagate event ${event.name}`);
          return channel.sendToQueue(
            `${queue}.out`,
            Buffer.from(JSON.stringify(event)),
            {
              contentType: 'application/json',
            },
          );
        });
      }),
  ]);
  const consumeIncomingEvents = (channel, eventStore, logger) => {
    function saveEvent(event) {
      eventStore.append(JSON.parse(event.content));
      logger.info(`Append event ${event.name} into eventStore`);
      return Promise.resolve();
    }

    // start channel listener
    return channel.assertQueue(`${queue}.out`, { durable: true, autoDelete: false })
      .then(() => channel.prefetch(1))
      .then(() => channel.consume(`${queue}.out`, saveEvent, { noAck: true }));
  };
  const connect = (publisher, eventStore, logger, err) => {
    if (err && err.message !== 'Connection closing') {
      debug('[AMQP] event connection failed (waiting for reconnection)', err.message);
      return connect(publisher, eventStore, logger);
    }
    return amqp.connect(process.env.AMQP_URL || 'amqp://localhost:5672')
      .then((connection) => {
        debug('[AMQP] event connection established');
        return connection.createChannel().then((channel) => {
          const currentChannel = channel;
          currentChannel.isConnected = true;
          return currentChannel;
        });
      })
      .catch(errConn => connect(publisher, eventStore, logger, errConn));
  };

  return {
    connect,
    consumeIncomingEvents,
    propagateEvents,
  };
};
