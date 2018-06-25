const Domain = require('../command/src/modules/domain');
const DemandeFinancementId = require('../command/src/modules/domain/src/demande-financement-id');
const EventDemandeFinancementCreated = require('../command/src/modules/domain/src/event-demande-financement-created');
const EventDemandeFinancementDeleted = require('../command/src/modules/domain/src/event-demande-financement-deleted');
const EventDemandeFinancementAddMontantDemande = require('../command/src/modules/domain/src/event-montant-demande-added');

let eventNumber = 0;
function consumeEvents(messageHandler) {
  // amqp delivers buffer event instead of plain JSON
  const mockAMQPCreateEvent = {
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    content: Buffer.from(JSON.stringify(new EventDemandeFinancementCreated(
      new DemandeFinancementId('test-from-AMQP'),
      new Domain.UserId('amqp-user'),
      {
        status: 'SUPPORTED',
        montant: {
          ttc: 10001.23
        },
      }))),
  };
  const mockAMQPAddMontantDemandeEvent = {
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    content: Buffer.from(JSON.stringify(new EventDemandeFinancementAddMontantDemande(
      new DemandeFinancementId('test-from-AMQP'),
      new Domain.UserId('amqp-user'),
      {
        ttc: 23456.78
      }))),
  };
  const mockAMQPDeleteEvent = {
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    content: Buffer.from(JSON.stringify(new EventDemandeFinancementDeleted(
      new DemandeFinancementId('test-from-AMQP'),
      new Domain.UserId('amqp-user'),
    ))),
  };
  if (eventNumber === 0) {
    eventNumber += 1;
    return messageHandler(mockAMQPCreateEvent);
  } else if (eventNumber === 1) {
    eventNumber += 1;
    return messageHandler(mockAMQPAddMontantDemandeEvent);
  } else {
    return messageHandler(mockAMQPDeleteEvent);
  }
};

function consumeCommands(messageHandler) {
  const mockAMQPCommand = {
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    content: {
      name: 'test-command',
    },
  };
  return messageHandler(mockAMQPCommand);
};

exports.propagateEvents = [];

exports.channelStub = (publisher, eventStore, logger) => {
  const channel = {
    isConnected: true,
    assertQueue: () => {
      return Promise.resolve();
    },
    sendToQueue: (queue, message, options) => {
      //console.log(`[AMQP] receive new message ${JSON.stringify(JSON.parse(message))}`);
      exports.propagateEvents.push(message);
      return Promise.resolve();
    },
    prefetch: () => {
      return Promise.resolve();
    },
    consume: (queue, messageHandler) => {
      if (queue.indexOf('.in') > -1) {
        return consumeCommands(messageHandler);
      } else {
        return consumeEvents(messageHandler);
      }
    },
  };
};

exports.connect = (publisher, eventStore, repository, logger) => {
  publisher.onAny((event) => {
    logger.info(`Propagate event ${event.type}`);
    exports.propagateEvents.push(event);
  });
  return Promise.resolve({
    createChannel: () => Promise.resolve(exports.channelStub(publisher, eventStore, logger)),
  });
};
