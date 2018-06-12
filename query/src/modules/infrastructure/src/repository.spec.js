const chai = require('chai');

const EventStore = require('./event-store');
const Repository = require('./repository');
const AggregateNotFound = require('./AggregateNotFound');

// mocks
const MockAggregate = {
  createFromEvents: (events) => ({
    aggregateId: events[0].aggregateId,
  }),
  toString: () => 'mockAggregate',
};
const fakeLogger = {
  info: () => (undefined), //console.info,
};
class MockEvent {
  constructor(aggregateId) {
    this.type = 'MockEvent';
    this.id = 'eventId';
    this.aggregateId = aggregateId;
    this.timestamp = Date.now;
    this.author = {
      id: 'mock-user',
    }
  };
};
class MockAggregateId {
  constructor(id) {
    this.id = id;
  };
  equals(other) {
    return this.id === other.id;
  };
};

describe('Repository', () => {
  let repository;
  let eventsStore;
  let publishEvent;

  beforeEach(() => {
    eventsStore = EventStore.create(fakeLogger);
    repository = Repository.create(MockAggregate, eventsStore);
    publishEvent = (evt) => {
      eventsStore.append(evt);
    };
  });

  it('Given no events When GetById Then throw UnknownAggregate', () => {
    chai.expect(() => {
      repository.getById(new MockAggregateId('BadId'));
    }).to.throw(AggregateNotFound);
  });

  it('Given several events When GetById Then Return Aggregate', () => {
    const defId = new MockAggregateId('def1');
    const eventCreated = new MockEvent(defId);
    const eventUpdated = new MockEvent(defId);
    eventsStore.append(eventCreated);
    eventsStore.append(eventUpdated);

    const aggregateFromRepository = repository.getById(defId);
    chai.expect(aggregateFromRepository)
      .to
      .have.property('aggregateId', defId);
  });
});
