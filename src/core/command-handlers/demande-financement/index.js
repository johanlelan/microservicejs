const DemandeFinancement = require('../../domain/demande-financement');
const createDemandeFinancement = require('./create');
const addMontantDemande = require('./add-montant-demande');
const deleteDemandeFinancement = require('./delete');

const demandeFinancementRepository = require('../../repositories/repository');

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

exports.create = function create(eventStore, publisher, logger, channel) {
  // retrieve repository
  const repository = demandeFinancementRepository.create(DemandeFinancement, eventStore);
  // every published demande-financement events should be sent to bus
  const commandHandler = {
    getRepository: () => repository,
    create: createDemandeFinancement(
      DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
    addMontantDemande: addMontantDemande(
      DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
    delete: deleteDemandeFinancement(
      DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
  };

  function consumerInputEvents() {
    if (!channel.isConnected) {
      logger.warn('No input messaging channel');
      return Promise.resolve({});
    }
    return Promise.all([
      channel.assertQueue(`${queue}.in`, { durable: true, exclusive: true, autoDelete: false }),
      channel.prefetch(1),
      channel.consume(`${queue}.in`, exports.buildMessageHandler(commandHandler, channel, logger), { noAck: true }),
    ]);
  }

  function propageEvents() {
    if (!channel.isConnected) {
      logger.warn('No output messaging channel');
      return Promise.resolve({});
    }
    return Promise.all([
      channel.assertQueue(`${queue}.out`, { durable: true, exclusive: true, autoDelete: false })
        .then(() => {
          publisher.onAny(event => channel.sendToQueue(
            `${queue}.out`,
            Buffer.from(JSON.stringify(event)),
            {
              contentType: 'application/json',
            },
          ));
        }),
    ]);
  }

  return Promise.all([
    propageEvents(),
    consumerInputEvents(),
  ]).then(() => commandHandler);
};
