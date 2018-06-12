const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');

const EventsStore = function EventsStore(logger) {
  const events = [];

  this.append = function append(event) {
    logger.info('Append event', event);
    if (!event.type) {
      throw new EventShouldBeNamed('Each event should be typed', event);
    }
    const eventType = event.type;
    if (!event.id) {
      throw new EventShouldContainsId(eventType, event);
    }
    if (!event.aggregateId) {
      throw new EventShouldContainsAggregateId(eventType, event);
    }
    if (!event.timestamp) {
      throw new EventShouldContainsTimestamp(eventType, event);
    }
    if (!event.author) {
      throw new EventShouldContainsAuthor(eventType, event);
    }
    logger.info(`event-store : save new event ${eventType} (${event.id})`);
    events.push(event);
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    return events.filter(event => aggregateId.equals(event.aggregateId));
  };
};

exports.create = function create(logger) {
  return new EventsStore(logger);
};
