process.env.EVENT_BUS = true;
const chai = require('chai');

const EventPublisher = require('../event-publisher');

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

const Bus = require('./event');
const eventBus = Bus.create(mockAmqp);

const mockEventStore = {
  append: (event) => {
    // nothing to do
    // console.log('Append event', event);
  },
  getEventsOfAggregate: (id) => [
      new DemandeFinancementCreated(id, { id: 'test@example.fr', title: 'test' }, {}),
    ],
};

const mockLogger = {
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
};

const eventPublisher = EventPublisher.create(mockLogger);

const mockChannel = mockBus.channelStub;

describe('Bus', () => {
  describe('When connected', () => {
    it('Should start bus even if connection failed', () => eventBus.connect(eventPublisher, mockEventStore, mockCommandHandler, mockLogger)
      .then(() => {
        return eventBus.connect(eventPublisher, mockEventStore, mockCommandHandler, mockLogger)
        .then(() => {
          chai.assert.isOk(true);
        });
      }));
    it('Should propagate events', () => eventBus.connect(eventPublisher, mockEventStore, mockCommandHandler, mockLogger)
      .then((channel) => {
        const promises = [
          eventBus.propagateEvents(eventPublisher, channel, mockLogger),
        ];
        return Promise.all(promises);
      })
      .then(() => {
        const eventRaised = new DemandeFinancementCreated(
          new DemandeFinancementId('propagate-event'),
          {
            id: 'any-user',
            title: 'any user'
          }, {
            status: 'REQUESTED'
          });
        // publish an event
        eventPublisher.publish(eventRaised);
        chai.expect(mockBus.propagateEvents).to.be.an.array;
        chai.expect(mockBus.propagateEvents.length).to.be.greaterThan(0);
        chai.expect(JSON.parse(mockBus.propagateEvents.pop())).to.have.property('name', eventRaised.name);
      }));
    it('Should consume incoming events', () => eventBus.connect(eventPublisher, mockEventStore, mockCommandHandler, mockLogger)
      .then((channel) => {
        const promises = [
          eventBus.consumeIncomingEvents(channel, mockEventStore, mockLogger),
        ];
        return Promise.all(promises);
      }));
    it('Should consume incoming commands', () => eventBus.connect(eventPublisher, mockEventStore, mockCommandHandler, mockLogger)
      .then((channel) => {
        const promises = [
          eventBus.consumeIncomingCommands(mockCommandHandler, channel, mockLogger),
        ];
        return Promise.all(promises);
      }));
  });
  describe('When Receiving Demande-financement Commands', () => {
    it('Should manage createDemandeFinancement', () => eventBus.buildMessageHandler(mockCommandHandler, {
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
        }));

    it('Should manage addMontantDemande', () => {

      const busMessageHandler = eventBus.buildMessageHandler(mockCommandHandler, {
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

    it('Should manage deleteDemandeFinancement', () => {

      const busMessageHandler = eventBus.buildMessageHandler(mockCommandHandler, {
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
    it('Should manage unknownCommand', () => {
      eventBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'unknownCommand',
          },
          payload: {
            name: 'unknownCommand',
          },
        }).then(result => {
          chai.assert.isOk(result);
        });
    });
  });
});
