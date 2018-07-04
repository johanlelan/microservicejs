const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');

const EventsStore = function EventsStore(logger) {
  const events = [];

  function validate(event) {
    if (!event.type) {
      return Promise.reject(new EventShouldBeNamed('Event should be typed', event));
    }
    const eventType = event.type;
    if (!event.id) {
      return Promise.reject(new EventShouldContainsId(eventType, event));
    }
    if (!event.aggregateId) {
      return Promise.reject(new EventShouldContainsAggregateId(eventType, event));
    }
    if (!event.timestamp) {
      return Promise.reject(new EventShouldContainsTimestamp(eventType, event));
    }
    if (!event.author) {
      return Promise.reject(new EventShouldContainsAuthor(eventType, event));
    }
    return Promise.resolve(event);
  }

  this.append = function append(event) {
    return validate(event)
      .then((validatedEvent) => {
        const eventType = validatedEvent.type;
        logger.debug(`[event-store] Append new ${eventType} event`, validatedEvent);
        events.push(validatedEvent);
        return Promise.resolve(validatedEvent);
      });
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    const toString = JSON.stringify(aggregateId);
    return Promise.resolve(events.filter(event => toString === JSON.stringify(event.aggregateId)));
  };
};

exports.create = function create(logger) {
  return new EventsStore(logger);
};
