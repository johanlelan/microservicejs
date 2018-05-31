const debug = require('debug')('messaging');
const amqp = require('amqplib');

const queue = 'demandes-financement';

exports.buildMessageHandler = (commandHandler, channel, logger) => (msg) => {
  const replyTo = msg && msg.properties && msg.properties.replyTo;
  const correlationId = msg && msg.properties && msg.properties.correlationId;
  logger.info(`[AMQP] need to reply to queue:${replyTo} with correlationId:${correlationId}`);

  const promises = [];

  // A message is a command handler
  // need to run domain logic by command type
  const command = msg && msg.payload;
  const result = {
    originalMessage: msg,
  };
  switch (command.name) {
    case 'createDemandeFinancement':
      promises.push(commandHandler.create(command));
      break;
    case 'addMontantDemande':
      promises.push(commandHandler.addMontantDemande(command));
      break;
    case 'deleteDemandeFinancement':
      promises.push(commandHandler.delete(command));
      break;
    default:
      logger.warn(`Nothing to do with ${command.name}`);
  }
  promises.push(channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), {
    correlationId,
  }));
  return Promise.all(promises);
};
exports.consumeIncomingCommands = (commandHandler, channel, logger) => Promise.all([
  channel.assertQueue(`${queue}.in`, { durable: true, exclusive: true, autoDelete: false }),
  channel.prefetch(1),
  channel.consume(`${queue}.in`, exports.buildMessageHandler(commandHandler, channel, logger), { noAck: true }),
]);

exports.propageEvents = (publisher, channel, logger) => Promise.all([
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

exports.consumeIncomingEvents = (channel, eventStore) => {
  function saveEvent(event) {
    eventStore.append(JSON.parse(event.content));
    return Promise.resolve();
  }

  // start channel listener
  return channel.assertQueue(`${queue}.out`, { durable: true, autoDelete: false })
    .then(() => channel.prefetch(1))
    .then(() => channel.consume(`${queue}.out`, saveEvent, { noAck: true }));
};

exports.connect = (publisher, eventStore, commandHandler, logger, err) => {
  if (err && err.message !== 'Connection closing') {
    debug('[AMQP] connection failed (waiting for reconnection)', err.message);
    return exports.connect(publisher, eventStore, commandHandler, logger);
  }
  return amqp.connect(process.env.AMQP_URL || 'amqp://localhost:5672')
    .then((bus) => {
      debug('[AMQP] connection established');
      return bus.createChannel().then((channel) => {
        const currentChannel = channel;
        currentChannel.isConnected = true;
        return currentChannel;
      });
    })
    .catch(errConn => exports.connect(publisher, eventStore, commandHandler, logger, errConn));
};
