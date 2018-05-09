const EventDontContainsId = require('./EventDontContainsId');
const EventDontContainsAggregateId = require('./EventDontContainsAggregateId');
const EventDontContainsTimestamp = require('./EventDontContainsTimestamp');
const EventDontContainsAuthor = require('./EventDontContainsAuthor');

const EventsStore = function EventsStore(logger) {
  const events = [];

  this.append = function append(event) {
    if (!event.id) {
      throw new EventDontContainsId(event.constructor.name, event);
    }
    if (!event.aggregateId) {
      throw new EventDontContainsAggregateId(event.constructor.name, event);
    }
    if (!event.timestamp) {
      throw new EventDontContainsTimestamp(event.constructor.name, event);
    }
    if (!event.author) {
      throw new EventDontContainsAuthor(event.constructor.name, event);
    }
    const eventName = event.constructor.name;
    const eventId = event.id;
    logger.info(`event-store : add new ${eventName} (${eventId})`);
    events.push(event);
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    return events.filter(event => event.aggregateId.equals(aggregateId));
  };
};

exports.create = function create(logger) {
  return new EventsStore(logger);
};
