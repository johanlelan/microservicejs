const chai = require('chai');

const DemandeFinancement = require('../../domain/demande-financement');
const buildCommandHandler = require('./index');
const DemandeFinancementCreated = require('../../domain/event-demande-financement-created');

const mockEventStore = {
  append: (event) => {
    // nothing to do
    // console.log('Append event', event);
  },
  getEventsOfAggregate: (id) => {
    return [
      new DemandeFinancementCreated(id, 'test@example.fr', {}),
    ];
  },
}

const mockPublisher = {
  publish: (event) => {
    // nothing to do
    // console.log('Publish event', event);
  },
  onAny: (event) => {
    // nothing to do
    // console.log('onAny event', event);
  },
}

const mockLogger = {
  info: () => (undefined), //console.info,
  warn: () => (undefined), //console.warn,
}

const mockChannel = require('../../../../test/mock-amqp.spec').channelStub;

describe('Demande-financement Commands', () => {
  it('Should manage createDemandeFinancement bus commands', () => {
    return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, mockChannel)
    .then(commandHandler => {
      buildCommandHandler.buildMessageHandler(commandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'mockAMQPMessage',
          },
          payload: {
            name: 'createDemandeFinancement',
            timestamp: Date.now(),
            user: {
              id: 'privileges-decision@example.com',
            },
          },
        }).then(result => {
          chai.assert.isOk(result);
        });  
    });
  });

  it('Should manage addMontantDemande bus commands', () => {
    return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, mockChannel)
    .then(commandHandler => {

      const busMessageHandler = buildCommandHandler.buildMessageHandler(commandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        payload: {
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
  });

  it('Should manage deleteDemandeFinancement bus commands', () => {
    return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, mockChannel)
    .then(commandHandler => {

      const busMessageHandler = buildCommandHandler.buildMessageHandler(commandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        payload: {
          name: 'deleteDemandeFinancement',
          timestamp: Date.now(),
          user: {
            id: 'any-user@example.com',
          },
          id: {
            id: 'test deleteDemandeFinancement from message bus',
          }
        },
      }).then(result => {
        chai.assert.isOk(result);
      });
    });
  });

  describe('When no message bus configured', () => {
    it('Should not consume any messages, should not propagate any events', () => {
      return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, {})
      .then(commandHandler => {
        chai.assert.isOk(commandHandler);
      });
    });
  });
});