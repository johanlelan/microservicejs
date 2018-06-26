process.env.EVENT_BUS = true;
const chai = require('chai');

const EventPublisher = require('../event-publisher');

// mock all messaging bus functions
const mockBus = require('../../../../../../test/mock-event.spec');

let connection = 0;
const mockAmqp = {
  connect: () => {
    if (connection === 0) {
      connection += 1;
      return Promise.reject(new Error({ message: 'Mock a connect error' }));
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
  append: () => {},
  getEventsOfAggregate: () => [],
};

const mockLogger = {
  debug: () => (undefined), // console.debug,
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
  error: () => (undefined), // console.error,
};

const eventPublisher = EventPublisher.create(mockLogger);

const mockRepository = {};

describe('Event Bus', () => {
  it('Should start bus even if connection failed', () => eventBus.connect(eventPublisher, mockEventStore, mockRepository, mockLogger, 'TEST')
    .then(() => eventBus.connect(eventPublisher, mockEventStore, mockRepository, mockLogger, 'TEST')
      .then(() => {
        chai.assert.isOk(true);
      })));
});
