const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');

const EventsStore = function EventsStore(logger) {
  const events = [];

  this.append = function append(event) {
    logger.info('Append event', event);
    if (!event.name) {
      throw new EventShouldBeNamed('Each event should be named', event);
    }
    const eventName = event.name;
    if (!event.id) {
      throw new EventShouldContainsId(eventName, event);
    }
    if (!event.aggregateId) {
      throw new EventShouldContainsAggregateId(eventName, event);
    }
    if (!event.timestamp) {
      throw new EventShouldContainsTimestamp(eventName, event);
    }
    if (!event.author) {
      throw new EventShouldContainsAuthor(eventName, event);
    }
    logger.info(`event-store : save new event ${eventName} (${event.id})`);
    events.push(event);
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    return events.filter(event => aggregateId.equals(event.aggregateId));
  };
};

exports.create = function create(logger) {
  return new EventsStore(logger);
};
