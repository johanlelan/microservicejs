const AggregateNotFound = require('./AggregateNotFound');

const Repository = function Repository(Aggregate, eventsStore) {
  const getAllEvents = function getAllEvents(id) {
    const events = eventsStore.getEventsOfAggregate(id);
    if (events.length === 0) {
      throw new AggregateNotFound('Not Found', { id });
    }

    return events;
  };

  // TODO JLL: getbyId should be a promise
  this.getById = function getById(id) {
    const events = getAllEvents(id);
    const state = Aggregate.createFromEvents(events);

    return state;
  };
};

exports.create = function create(Aggregate, eventsStore) {
  return new Repository(Aggregate, eventsStore);
};
