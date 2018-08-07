const AggregateNotFound = require('./AggregateNotFound');

const Repository = function Repository(Aggregate, eventsStore) {
  const getAllEvents = function getAllEvents(aggregateId) {
    return eventsStore.getEventsOfAggregate(aggregateId)
      .then((events) => {
        if (events.length === 0) {
          return Promise.reject(new AggregateNotFound('Not Found', { aggregateId }));
        }
        return events;
      });
  };

  this.getAggregate = function getAggregate() {
    return Promise.resolve(Aggregate);
  };

  this.save = function save(event) {
    return eventsStore.save(event);
  };

  this.getById = function getById(id) {
    return getAllEvents(id)
      .then(events => Aggregate.createFromEvents(events));
  };
};

exports.create = function create(Aggregate, eventsStore) {
  return new Repository(Aggregate, eventsStore);
};
