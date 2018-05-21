const amqp = require('amqplib');
const sinon = require('sinon');

const DemandeFinancementId = require('../src/command/core/domain/demande-financement-id');
const EventDemandeFinancementCreated = require('../src/command/core/domain/event-demande-financement-created');

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
    const mockAMQPMessage = {
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
    return messageHandler(mockAMQPMessage);
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
