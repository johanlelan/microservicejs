const amqp = require('amqplib');
const sinon = require('sinon');

const DemandeFinancementId = require('../command/src/modules/domain/src/demande-financement-id');
const EventDemandeFinancementCreated = require('../command/src/modules/domain/src/event-demande-financement-created');
const EventDemandeFinancementDeleted = require('../command/src/modules/domain/src/event-demande-financement-deleted');
const EventDemandeFinancementAddMontantDemande = require('../command/src/modules/domain/src/event-montant-demande-added');

let eventNumber = 0;
function consumeEvents(messageHandler) {
  // amqp delivers buffer event instead of plain JSON
  const mockAMQPCreateEvent = Buffer.from(JSON.stringify({
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    payload: new EventDemandeFinancementCreated(
      new DemandeFinancementId('test-from-AMQP'),
      'amqp-user',
      {
        status: 'SUPPORTED',
        montant: {
          ttc: 10001.23
        },
      }),
  }));
  const mockAMQPAddMontantDemandeEvent = Buffer.from(JSON.stringify({
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    payload: new EventDemandeFinancementAddMontantDemande(
      new DemandeFinancementId('test-from-AMQP'),
      'amqp-user',
      {
        ttc: 23456.78
      }),
  }));
  const mockAMQPDeleteEvent = Buffer.from(JSON.stringify({
    properties: {
      replyTo: 'test-queue',
      correlationId: 'mockAMQPMessage',
    },
    payload: new EventDemandeFinancementDeleted(
      new DemandeFinancementId('test-from-AMQP'),
      'amqp-user',
    ),
  }));
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
    payload: {
      name: 'test-command',
    },
  };
  return messageHandler(mockAMQPCommand);
};

exports.propagateEvents = [];

exports.channelStub = {
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

exports.connect = {
  createChannel: () => Promise.resolve(exports.channelStub),
};

// mock amqp
let connection = 0;
const stub = sinon.stub(amqp, 'connect');
exports.stub = stub;
