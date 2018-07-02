const debug = require('debug')('microservice:infrastructure:bus:commands:amqp');
const amqp = require('amqplib');

const queue = 'demandes-financement';

const buildMessageHandler = (commandHandler, channel, logger) => (msg) => {
  const replyTo = msg && msg.properties && msg.properties.replyTo;
  const correlationId = msg && msg.properties && msg.properties.correlationId;
  logger.info(`[AMQP] need to reply to queue:${replyTo} with correlationId:${correlationId}`);

  const promises = [];

  // A message is a command handler
  // need to run domain logic by command type
  const command = msg && msg.content;
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
const consumeIncomingCommands = (commandHandler, channel, logger) => Promise.all([
  channel.assertQueue(`${queue}.commands.in`, { durable: true, exclusive: false, autoDelete: false }),
  channel.prefetch(1),
  channel.consume(`${queue}.commands.in`, buildMessageHandler(commandHandler, channel, logger), { noAck: true }),
]);
exports.connect = (handler, publisher, eventStore, logger) => {
  debug('Establishing AMQP connection...');
  return amqp.connect(process.env.AMQP_URL || 'amqp://localhost:5672')
    .then((connection) => {
      debug('Connection established');
      return connection;
    })
    .then(connection => connection.createChannel().then((channel) => {
      const currentChannel = channel;
      currentChannel.isConnected = true;
      return Promise.all([
        consumeIncomingCommands(
          handler,
          channel,
          logger,
        ),
      ]).then(() => {
        logger.info('[Command] [AMQP] connection established');
      });
    }));
};
