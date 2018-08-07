const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');

/**
 * An event-store offers save, append and getEventsOfAggregate
 * @param {*} logger to log every I/O
 */
const EventsStore = function EventsStore(logger) {
  const events = [];

  function validate(event) {
    if (!event.type) {
      logger.error('[event-store] Event should be typed', event);
      return Promise.reject(new EventShouldBeNamed('Event should be typed', event));
    }
    const eventType = event.type;
    if (!event.id) {
      logger.error('[event-store] Event should contain id', event);
      return Promise.reject(new EventShouldContainsId(eventType, event));
    }
    if (!event.aggregateId) {
      logger.error('[event-store] Event should contain aggregateId', event);
      return Promise.reject(new EventShouldContainsAggregateId(eventType, event));
    }
    if (!event.timestamp) {
      logger.error('[event-store] Event should contain timestamp', event);
      return Promise.reject(new EventShouldContainsTimestamp(eventType, event));
    }
    if (!event.author) {
      logger.error('[event-store] Event should contain author', event);
      return Promise.reject(new EventShouldContainsAuthor(eventType, event));
    }
    return Promise.resolve(event);
  }

  this.save = function save(event) {
    events.push(event);
    return Promise.resolve(event);
  };

  this.append = function append(event) {
    return validate(event)
      .then((validatedEvent) => {
        const eventType = validatedEvent.type;
        logger.debug(`[event-store] Append new ${eventType} event`, validatedEvent);
        this.save(validatedEvent);
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
