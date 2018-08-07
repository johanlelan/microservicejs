const chai = require('chai');

const EventStore = require('./event-store');
const Repository = require('./repository');
const AggregateNotFound = require('./AggregateNotFound');

// mocks
const MockAggregate = {
  createFromEvents: events => ({
    aggregateId: events[0].aggregateId,
  }),
  toString: () => 'mockAggregate',
};
const fakeLogger = {
  info: () => (undefined), // console.info,
  debug: () => (undefined), // console.debug,
};
class MockEvent {
  constructor(aggregateId) {
    this.type = 'MockEvent';
    this.id = 'eventId';
    this.aggregateId = aggregateId;
    this.timestamp = Date.now;
    this.author = {
      id: 'mock-user',
    };
  }
}
class MockAggregateId {
  constructor(id) {
    this.id = id;
  }
  equals(other) {
    return this.id === other.id;
  }
}

describe('Repository', () => {
  let repository;
  let eventsStore;

  beforeEach(() => {
    eventsStore = EventStore.create(fakeLogger);
    repository = Repository.create(MockAggregate, eventsStore);
  });

  it('Given no events When GetById Then throw UnknownAggregate', () => repository.getById(new MockAggregateId('BadId'))
    .catch(error => chai.expect(error).to.be.instanceOf(AggregateNotFound)));

  it('Given several events When GetById Then Return Aggregate', () => {
    const defId = new MockAggregateId('def1');
    const eventCreated = new MockEvent(defId);
    const eventUpdated = new MockEvent(defId);
    return Promise.all([
      eventsStore.append(eventCreated),
      eventsStore.append(eventUpdated),
    ]).then(() => repository.getById(defId)
      .then((aggregateFromRepository) => {
        chai.expect(aggregateFromRepository)
          .to
          .have.property('aggregateId', defId);
      }));
  });

  it('Given an event When Save Then same event', () => {
    const defId = new MockAggregateId('def1');
    const eventCreated = new MockEvent(defId);
    return repository.save(eventCreated)
      .then(() => repository.getById(defId)
        .then((aggregateFromRepository) => {
          chai.expect(aggregateFromRepository)
            .to
            .have.property('aggregateId', defId);
        }));
  });

  it('Given an event When GetAggregate Then return MockAggregate', () => repository.getAggregate()
    .then(Aggregate => chai.expect(Aggregate)
      .to
      .equal(MockAggregate)));
});
