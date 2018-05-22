const chai = require('chai');

const EventPublisher = require('../event-publisher')

const DemandeFinancement = require('../../../src/domain/demande-financement');
const DemandeFinancementHandler = require('../../command/command-handlers/demande-financement/index');
const DemandeFinancementId = require('../../../src/domain/demande-financement-id');
const DemandeFinancementCreated = require('../../../src/domain/event-demande-financement-created');

// mock all messaging bus functions
const mockBus = require('../../../test/mock-amqp.spec')
const Bus = require('./event');

const mockEventStore = {
  append: (event) => {
    // nothing to do
    // console.log('Append event', event);
  },
  getEventsOfAggregate: (id) => {
    return [
      new DemandeFinancementCreated(id, { id: 'test@example.fr', title: 'test' }, {}),
    ];
  },
};

const mockLogger = {
  info: () => (undefined), //console.info,
  warn: () => (undefined), //console.warn,
};

const eventPublisher = EventPublisher.create(mockLogger);

const mockChannel = mockBus.channelStub;

describe('Bus', () => {
  describe('When connected', () => {
    it('Should start bus even if connection failed', () => {
      return DemandeFinancementHandler.create(mockEventStore, eventPublisher, mockLogger, mockChannel)
        .then(commandHandler => {
          return Bus.connect(eventPublisher, mockEventStore, commandHandler, mockLogger)
          .then((bus) => {
            return Bus.connect(eventPublisher, mockEventStore, commandHandler, mockLogger)
            .then((bus) => {
              chai.assert.isOk(true);
            });
          });
        });
    });
    it('Should propagate events', () => {
      return DemandeFinancementHandler.create(mockEventStore, eventPublisher, mockLogger, mockChannel)
        .then(commandHandler => {
          return Bus.connect(eventPublisher, mockEventStore, commandHandler, mockLogger)
          .then((bus) => {
            // publish an event
            eventPublisher.publish(
              new DemandeFinancementCreated(
                new DemandeFinancementId('propagate-event'),
                {
                  id: 'any-user',
                  title: 'any user'
                }, {
                  status: 'REQUESTED'
                }));
          });
        });
    });
  });

  describe('When Receiving Demande-financement Commands', () => {
    it('Should manage createDemandeFinancement', () => {
      return DemandeFinancementHandler.create(mockEventStore, eventPublisher, mockLogger, mockChannel)
      .then(commandHandler => {
        Bus.buildMessageHandler(commandHandler, {
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

    it('Should manage addMontantDemande', () => {
      return DemandeFinancementHandler.create(mockEventStore, eventPublisher, mockLogger, mockChannel)
      .then(commandHandler => {

        const busMessageHandler = Bus.buildMessageHandler(commandHandler, {
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

    it('Should manage deleteDemandeFinancement', () => {
      return DemandeFinancementHandler.create(mockEventStore, eventPublisher, mockLogger, mockChannel)
      .then(commandHandler => {

        const busMessageHandler = Bus.buildMessageHandler(commandHandler, {
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
    });
  });

  describe('When No Bus is configured Then No Propagation', () => {
    it('Should not consume any messages, should not propagate any events', () => {
      return DemandeFinancementHandler.create(mockEventStore, eventPublisher, mockLogger, {})
      .then(commandHandler => {
        chai.assert.isOk(commandHandler);
      });
    });
  });
});