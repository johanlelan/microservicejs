const EventDontContainsId = require('./EventDontContainsId');
const EventDontContainsAggregateId = require('./EventDontContainsAggregateId');
const EventDontContainsTimestamp = require('./EventDontContainsTimestamp');
const EventDontContainsAuthor = require('./EventDontContainsAuthor');

const EventsStore = function EventsStore(logger) {
  const events = [];

  this.append = function append(event) {
    const eventName = event.constructor.name;
    if (!event.id) {
      throw new EventDontContainsId(eventName, event);
    }
    if (!event.aggregateId) {
      throw new EventDontContainsAggregateId(eventName, event);
    }
    if (!event.timestamp) {
      throw new EventDontContainsTimestamp(eventName, event);
    }
    if (!event.author) {
      throw new EventDontContainsAuthor(eventName, event);
    }
    logger.info(`event-store : save new event ${eventName} (${event.id})`);
    events.push(event);
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    return events.filter(event => event.aggregateId.equals(aggregateId));
  };
};

exports.create = function create(logger) {
  return new EventsStore(logger);
};
