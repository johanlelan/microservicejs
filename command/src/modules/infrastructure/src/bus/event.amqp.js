const Debug = require('debug');
const amqp = require('amqplib');

const debug = Debug('microservice:infrastructure:bus:commands:amqp');

const queue = 'demandes-financement';

exports.connect = (publisher, eventStore, repository, logger, mode) => {
  debug('Establishing AMQP connection...');
  return amqp.connect(process.env.AMQP_URL || 'amqp://localhost:5672')
    .then(connection => connection.createChannel().then((channel) => {
      const currentChannel = channel;
      currentChannel.isConnected = true;
      const propagateEvents = Promise.all([
        channel.assertQueue(`${queue}.events.out`, { durable: true, autoDelete: false })
          .then(() => {
            publisher.onAny((event) => {
              logger.info(`Propagate event ${event.type}`);
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
      function saveEvent(msg) {
        const event = JSON.parse(msg.content);
        eventStore.append(event);
        logger.info(`Append event ${event.type} into eventStore`);
        return Promise.resolve();
      }
      const promises = [];
      if (mode === 'COMMAND') {
        promises.push(propagateEvents);
      } else {
        promises.push(channel.assertQueue(`${queue}.events.out`, { durable: true, autoDelete: false })
          .then(() => channel.prefetch(1))
          .then(() => channel.consume(`${queue}.events.out`, saveEvent, { noAck: true })));
      }
      return Promise.all(promises).then(() => {
        logger.info('Event AMQP connection established');
      });
    }));
};
