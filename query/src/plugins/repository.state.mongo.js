
const debug = require('debug')('microservice:query:plugins:repository:mongo');
const MongoDB = require('mongodb');

const AggregateNotFound = require('../modules/infrastructure/src/AggregateNotFound');

const StateRepositoryMongo = function StateRepositoryMongo(collection, Aggregate) {
  this.getAggregate = function getAggregate() {
    return Aggregate;
  };
  // TODO JLL: getbyId should be a promise
  this.getById = async function getById(aggregateId) {
    // find into mongodb the given aggregateId
    const state = await collection.findOne({ _id: aggregateId.id });
    if (!state) {
      debug(`No entry for Aggregate ${state.aggregateId.id} in ${collection.collectionName}`, state);
      throw new AggregateNotFound('Not Found', { aggregateId });
    }
    debug(`Aggregate ${state.aggregateId.id} found in MongoDB`);
    return Aggregate.wrap(state);
  };
  this.save = async function save(state) {
    // find into mongodb the given aggregateId
    await collection.update({ _id: state.aggregateId.id }, state, { upsert: true });
    debug(`New Aggregate ${state.aggregateId.id} state saved in ${collection.collectionName}`);
    return state;
  };
};

module.exports = mongoURL => MongoDB.MongoClient.connect(mongoURL, {
  autoReconnect: true,
  bufferMaxEntries: 0,
  reconnectTries: 3600,
  keepAlive: 10000,
  promiseLibrary: Promise,
  useNewUrlParser: true,
}).then((connection) => {
  debug('Connection established', mongoURL);
  return connection;
})
  .then(connection => ({
    create: function create(Aggregate, collectionName) {
      const stateDB = connection.db('states');
      const collection = stateDB.collection(collectionName);
      // TODO JLL: ensure index for state collection
      return new StateRepositoryMongo(collection, Aggregate);
    },
  }));

