const AggregateNotFound = require('./AggregateNotFound');

const Repository = function Repository(Aggregate, eventsStore) {
  const getAllEvents = function getAllEvents(id) {
    return eventsStore.getEventsOfAggregate(id)
      .then((events) => {
        if (events.length === 0) {
          return Promise.reject(new AggregateNotFound('Not Found', { id }));
        }
        return events;
      });
  };

  this.getById = function getById(id) {
    return getAllEvents(id)
      .then(events => Aggregate.createFromEvents(events));
  };
};

exports.create = function create(Aggregate, eventsStore) {
  return new Repository(Aggregate, eventsStore);
};
