process.env.EVENT_BUS = true;
const chai = require('chai');

const DemandeFinancement = require('../../../domain/src/demande-financement');
const DemandeFinancementId = require('../../../domain/src/demande-financement-id');
const DemandeFinancementCreated = require('../../../domain/src/event-demande-financement-created');
const DemandeFinancementMontantDemandeAdded = require('../../../domain/src/event-montant-demande-added');
const DemandeFinancementDeleted = require('../../../domain/src/event-demande-financement-deleted');

// mock all messaging bus functions
const mockBus = require('../../../../../../test/mock-amqp.spec');
const mockCommandHandler = {
  create: () => { return new DemandeFinancementCreated('commandHandlerMock', { id: 'mock-user' }, {}); },
  addMontantDemande: () => { return new DemandeFinancementMontantDemandeAdded('commandHandlerMock', { id: 'mock-user' }, { ttc: 1.01 }); },
  delete: () => { return new DemandeFinancementDeleted('commandHandlerMock', { id: 'mock-user' }); },
};
let connection = 0;
const mockAmqp = {
  connect: () => {
    if (connection === 0) {
      connection += 1;
      return Promise.reject({ message: 'Mock a connect error'});
    }
    if (connection === 1) {
      connection += 1;
      return Promise.resolve(mockBus.connect);
    }
    return Promise.resolve(mockBus.connect);
  },
};

const Bus = require('./command');
const commandBus = Bus.create(mockAmqp);

const mockLogger = {
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
};

const mockChannel = mockBus.channelStub;

describe('Command Bus', () => {
  describe('When connected', () => {
    it('Should consume incoming commands', () => commandBus.connect(mockCommandHandler, mockLogger)
      .then((channel) => {
        const promises = [
          commandBus.consumeIncomingCommands(mockCommandHandler, channel, mockLogger),
        ];
        return Promise.all(promises);
      }));
  });
  describe('When Receiving Demande-financement Commands', () => {
    it('Should manage createDemandeFinancement', () => commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'mockAMQPMessage',
          },
          content: {
            name: 'createDemandeFinancement',
            timestamp: Date.now(),
            user: {
              id: 'privileges-decision@example.com',
            },
          },
        }).then(result => {
          chai.assert.isOk(result);
        }));

    it('Should manage addMontantDemande', () => {

      const busMessageHandler = commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        content: {
          name: 'addMontantDemande',
          timestamp: Date.now(),
          user: {
            id: 'any-user@example.com',
          },
          id: {
            id: 'test addMontantDemande from message bus',
          },
          data: {
            ttc: 890.67,
          }
        },
      }).then(result => {
        chai.assert.isOk(result);
      });
    });
    it('Should manage deleteDemandeFinancement', () => {

      const busMessageHandler = commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        content: {
          name: 'deleteDemandeFinancement',
          timestamp: Date.now(),
          user: {
            id: 'test@example.fr',
            title: 'test',
          },
          id: {
            id: 'test deleteDemandeFinancement from message bus',
          }
        },
      }).then(result => {
        chai.assert.isOk(result);
      });
    });
    it('Should manage unknownCommand', () => {
      commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'unknownCommand',
          },
          content: {
            name: 'unknownCommand',
          },
        }).then(result => {
          chai.assert.isOk(result);
        });
    });
  });
});
