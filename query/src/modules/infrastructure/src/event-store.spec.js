const eventsStoreModule = require('./event-store');
const sortBy = require('lodash.sortby');
const map = require('lodash.map');
const chai = require('chai');
const assertArrays = require('chai-arrays');
const uuid = require('uuid');

const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');

const fakeLogger = {
  info: () => (undefined), //console.info,
}
chai.use(assertArrays);

describe('Events Store', () => {
  let eventsStore;
  beforeEach(() => {
    eventsStore = eventsStoreModule.create(fakeLogger);
  });

  class AggregateId {
    constructor(id) {
      this.id = id;
      Object.freeze(this);
    }
  
    equals(other) {
      if (!other) {
        return false;
      }
      return this.toString() === other.toString();
    }
  
    toString() {
      return `Id:${this.id}`;
    }
  }
  
  function TestEvent(aggregateId, num) {
    this.type = 'TestEvent';
    this.id = uuid.v4();
    this.aggregateId = aggregateId;
    this.num = num;
    this.timestamp = Date.now();
    this.author = 'same-author@example.fr';
  }

  const BadEvent = function BadEvent() { };

  describe('Event validation', () => {

    it('When store event without name Then throw exception', () => {
      chai.expect(() => {
        eventsStore.append(new BadEvent());
      }).to.throw(EventShouldBeNamed);
    });
    it('When store event without id Then throw exception', () => {
      function EventWithoutId() {
        this.type = 'EventWithoutId';
      }
      chai.expect(() => {
        eventsStore.append(new EventWithoutId());
      }).to.throw(EventShouldContainsId);
    });
    it('When store event without aggregateId Then throw exception', () => {
      function EventWithoutAggregateId() {
        this.type = 'EventWithoutAggregateId';
        this.id = uuid.v4();
      }
      chai.expect(() => {
        eventsStore.append(new EventWithoutAggregateId());
      }).to. throw(EventShouldContainsAggregateId);
    });
    it('When store event of aggregate without timestamp Then throw exception', () => {
      function EventWithoutTimestamp(aggregateId) {
        this.type = 'EventWithoutTimestamp';
        this.id = uuid.v4();
        this.aggregateId = aggregateId;
      }
      const aggregateId = new AggregateId('AggregateA');
      chai.expect(() => {
        eventsStore.append(new EventWithoutTimestamp(aggregateId));
      }).to. throw(EventShouldContainsTimestamp);
    });
  
    it('When store event of aggregate without author Then throw exception', () => {
      function EventWithoutAuthor(aggregateId) {
        this.type = 'EventWithoutAuthor';
        this.id = uuid.v4();
        this.aggregateId = aggregateId;
        this.timestamp = Date.now();
      }
      const aggregateId = new AggregateId('AggregateA');
      chai.expect(() => {
        eventsStore.append(new EventWithoutAuthor(aggregateId));
      }).to. throw(EventShouldContainsAuthor);
    });
  });

  it('When store event of aggregate Then can get this event of aggregate', () => {
    const aggregateId = new AggregateId('AggregateA');
    eventsStore.append(new TestEvent(aggregateId));

    const result = eventsStore.getEventsOfAggregate(aggregateId);

    chai.expect(result).have.length(1);
    chai.expect(result[0].aggregateId).to.deep.equal(aggregateId);
  });

  it('When get this event of aggregate Then use equals and not operator', () => {
    const id = 'AggregateA';
    eventsStore.append(new TestEvent(new AggregateId(id)));

    const result = eventsStore.getEventsOfAggregate(new AggregateId(id));

    chai.expect(result).to.be.ofSize(1);
    chai.expect(result[0].aggregateId).to.deep.equal(new AggregateId(id));
  });

  it('Given events of several aggregates When getEventsOfAggregate Then return events of only this aggregate', () => {
    const aggregateId1 = new AggregateId('AggregateA');
    const aggregateId2 = new AggregateId('AggregateB');
    eventsStore.append(new TestEvent(aggregateId1));
    eventsStore.append(new TestEvent(aggregateId2));
    eventsStore.append(new TestEvent(aggregateId1));

    const result = eventsStore.getEventsOfAggregate(aggregateId1);
    // expect right number of events
    chai.expect(result).to.have.length(2);
    // expect right order of Ids
    const aggregateIds = map(result, 'aggregateId');
    chai.expect(aggregateIds).to.deep.include(aggregateId1);
    chai.expect(aggregateIds).and.not.include(aggregateId2);
  });

  it('Given several events When GetEventsOfAggregate Then return events and preserve order', () => {
    const aggregateId1 = new AggregateId('AggregateA');
    eventsStore.append(new TestEvent(aggregateId1, 1));
    eventsStore.append(new TestEvent(aggregateId1, 2));
    eventsStore.append(new TestEvent(aggregateId1, 3));

    const result = eventsStore.getEventsOfAggregate(aggregateId1);

    chai.expect(result).to.have.length(3);
    chai.expect(sortBy(result, 'num')).to.deep.equals(result);
  });
});
