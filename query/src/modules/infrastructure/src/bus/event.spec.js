process.env.EVENT_BUS = true;
const chai = require('chai');

const EventPublisher = require('../event-publisher');

// mock all messaging bus functions
class mockEvent {
  constructor() {
    this.type = 'mockEvent';
  }
};
const mockBus = require('../../../../../../test/mock-event.spec');
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
    console.log('Append event', event);
  },
  getEventsOfAggregate: (id) => [
      new DemandeFinancementCreated(id, { id: 'test@example.fr', title: 'test' }, {}),
    ],
};

const mockLogger = {
  debug: () => (undefined), // console.debug,
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
  error: () => (undefined), // console.error,
};

const eventPublisher = EventPublisher.create(mockLogger);

const mockChannel = mockBus.channelStub;

describe('Event Bus', () => {
  it('Should start bus even if connection failed', () => eventBus.connect(eventPublisher, mockEventStore, mockLogger, 'TEST')
    .then(() => {
      return eventBus.connect(eventPublisher, mockEventStore, mockLogger, 'TEST')
      .then(() => {
        chai.assert.isOk(true);
      });
    }));
});
