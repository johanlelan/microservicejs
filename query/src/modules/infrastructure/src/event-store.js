const EventShouldBeNamed = require('./EventShouldBeNamed');
const EventShouldContainsId = require('./EventShouldContainsId');
const EventShouldContainsAggregateId = require('./EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('./EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('./EventShouldContainsAuthor');

const EventsStore = function EventsStore(logger, repository) {
  const events = [];

  function save(event) {
    if (repository) {
      return repository.save(event);
    }
    return events.push(event);
  }

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

  this.append = function append(event) {
    return validate(event)
      .then((validatedEvent) => {
        const eventType = validatedEvent.type;
        logger.debug(`[event-store] Append new ${eventType} event`, validatedEvent);
        save(validatedEvent);
        return Promise.resolve(validatedEvent);
      });
  };

  this.getEventsOfAggregate = function getEventsOfAggregate(aggregateId) {
    if (repository) {
      return repository.getById(aggregateId);
    }
    const toString = JSON.stringify(aggregateId);
    return Promise.resolve(events.filter(event => toString === JSON.stringify(event.aggregateId)));
  };
};

exports.create = function create(logger, repository) {
  return new EventsStore(logger, repository);
};
