const Debug = require('debug');
const amqp = require('amqplib');

const debug = Debug('microservice:infrastructure:bus:commands:amqp');

const queue = 'demandes-financement';

exports.connect = (publisher, eventStore, logger) => {
  debug('Establishing AMQP connection...');
  return amqp.connect(process.env.AMQP_URL || 'amqp://localhost:5672')
    .then(connection => connection.createChannel().then((channel) => {
      const currentChannel = channel;
      currentChannel.isConnected = true;
      const propagateEvents = Promise.all([
        channel.assertQueue(`${queue}.events.out`, { durable: true, autoDelete: false })
          .then(() => {
            publisher.onAny((event) => {
              logger.info(`Propagate event ${event.name}`);
              return channel.sendToQueue(
                `${queue}.events.out`,
                Buffer.from(JSON.stringify(event)),
                {
                  contentType: 'application/json',
                },
              );
            });
          }),
      ]);
      function saveEvent(event) {
        eventStore.append(JSON.parse(event.content));
        logger.info(`Append event ${event.name} into eventStore`);
        return Promise.resolve();
      }
      const consumeIncomingEvents = Promise.all([
        channel.assertQueue(`${queue}.events.out`, { durable: true, autoDelete: false })
          .then(() => channel.prefetch(1))
          .then(() => channel.consume(`${queue}.events.out`, saveEvent, { noAck: true }))]);
      return Promise.all([
        propagateEvents,
        consumeIncomingEvents,
      ]).then(() => {
        logger.info('Event AMQP connection established');
      });
    }));
};
