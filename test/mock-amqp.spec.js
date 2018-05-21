const amqp = require('amqplib');
const sinon = require('sinon');

const DemandeFinancementId = require('../src/domain/demande-financement-id');
const EventDemandeFinancementCreated = require('../src/domain/event-demande-financement-created');
const EventDemandeFinancementDeleted = require('../src/domain/event-demande-financement-deleted');
const EventDemandeFinancementAddMontantDemande = require('../src/domain/event-montant-demande-added');

let eventNumber = 0;
exports.channelStub = {
  isConnected: true,
  assertQueue: () => {
    return Promise.resolve();
  },
  sendToQueue: (queue, message, options) => {
    //console.log(`[AMQP] receive new message ${JSON.stringify(JSON.parse(message))}`);
    return Promise.resolve();
  },
  prefetch: () => {
    return Promise.resolve();
  },
  consume: (queue, messageHandler) => {
    const mockAMQPCreateEvent = {
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
    };
    const mockAMQPAddMontantDemandeEvent = {
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
    };
    const mockAMQPDeleteEvent = {
      properties: {
        replyTo: 'test-queue',
        correlationId: 'mockAMQPMessage',
      },
      payload: new EventDemandeFinancementDeleted(
        new DemandeFinancementId('test-from-AMQP'),
        'amqp-user',
      ),
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
  },
};

exports.connect = {
  createChannel: () => Promise.resolve(exports.channelStub),
};

// mock amqp
let firstConnect = true;
sinon.stub(amqp, 'connect').callsFake(() => {
  if (firstConnect) {
    firstConnect = false;
    return Promise.reject('Mock a connect error');
  }
  return Promise.resolve(exports.connect);
});
