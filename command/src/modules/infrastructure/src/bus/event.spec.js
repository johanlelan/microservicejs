process.env.EVENT_BUS = true;
const chai = require('chai');

const EventPublisher = require('../event-publisher');

// mock all messaging bus functions
class mockEvent {
  constructor() {
    this.name = 'mockEvent';
  }
};
const mockBus = require('../../../../../../test/mock-amqp.spec');
const mockCommandHandler = {
  create: () => { return new mockEvent(); },
  addMontantDemande: () => { return new mockEvent(); },
  delete: () => { return new mockEvent(); },
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

describe('Event Bus', () => {
  describe('When connected', () => {
    it('Should start bus even if connection failed', () => eventBus.connect(eventPublisher, mockEventStore, mockLogger)
      .then(() => {
        return eventBus.connect(eventPublisher, mockEventStore, mockLogger)
        .then(() => {
          chai.assert.isOk(true);
        });
      }));
    it('Should propagate events', () => eventBus.connect(eventPublisher, mockEventStore, mockLogger)
      .then((channel) => {
        const promises = [
          eventBus.propagateEvents(eventPublisher, channel, mockLogger),
        ];
        return Promise.all(promises);
      })
      .then(() => {
        const eventRaised = new mockEvent();
        // publish an event
        eventPublisher.publish(eventRaised);
        chai.expect(mockBus.propagateEvents).to.be.an.array;
        chai.expect(mockBus.propagateEvents.length).to.be.greaterThan(0);
        chai.expect(JSON.parse(mockBus.propagateEvents.pop())).to.have.property('name', eventRaised.name);
      }));
    it('Should consume incoming events', () => eventBus.connect(eventPublisher, mockEventStore, mockLogger)
      .then((channel) => {
        const promises = [
          eventBus.consumeIncomingEvents(channel, mockEventStore, mockLogger),
        ];
        return Promise.all(promises);
      }));
  });
});
