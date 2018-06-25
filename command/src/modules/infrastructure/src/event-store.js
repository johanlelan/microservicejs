const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');

const EventsStore = function EventsStore(logger) {
  const events = [];

  this.append = function append(event) {
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
    logger.debug(`[event-store] Append new ${eventType} event`, event);
    events.push(event);
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    const toString = JSON.stringify(aggregateId);
    return events.filter(event => toString === JSON.stringify(event.aggregateId));
  };
};

exports.create = function create(logger) {
  return new EventsStore(logger);
};
