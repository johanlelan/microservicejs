const AggregateNotFound = require('../modules/infrastructure/src/AggregateNotFound');

const StateRepositoryElasticsearch = function StateRepositoryElasticsearch(Aggregate, eventsStore) {
  const getAllEvents = function getAllEvents(id) {
    const events = eventsStore.getEventsOfAggregate(id);
    if (events.length === 0) {
      throw new AggregateNotFound('Not Found', { id });
    }

    return events;
  };

  this.getById = async function getById(id) {
    const events = getAllEvents(id);
    const state = Aggregate.createFromEvents(events);

    return state;
  };
};

exports.create = function create(Aggregate, eventsStore) {
  return new StateRepositoryElasticsearch(Aggregate, eventsStore);
};
