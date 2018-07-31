
const debug = require('debug')('microservice:query:plugins:repository:mongo');
const MongoDB = require('mongodb');

const AggregateNotFound = require('../modules/infrastructure/src/AggregateNotFound');

const StateRepositoryMongo = function StateRepositoryMongo(collection, Aggregate) {
  this.getAggregate = function getAggregate() {
    return Aggregate;
  };
  this.getById = async function getById(aggregateId) {
    // find into mongodb the given aggregateId
    const state = await collection.findOne({ _id: aggregateId.id }, { _id: 0 });
    if (!state) {
      debug(`No entry for Aggregate ${aggregateId.id} in ${collection.collectionName}`, state);
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

const connectWithRetry = (mongoUrl, logger) => MongoDB.MongoClient.connect(mongoUrl, {
  autoReconnect: true,
  bufferMaxEntries: 0,
  reconnectTries: 3600,
  keepAlive: 10000,
  promiseLibrary: Promise,
  useNewUrlParser: true,
}).then((db) => {
  db.on('error', dbErr => logger.error(`MongoDB connection error. Please make sure MongoDB is running. -> ${dbErr}`));
  db.on('reconnect', () => logger.info('MongoDB connection reconnected.'));
  db.on('close', () => logger.info('MongoDB connection disconnected.'));
  return db;
}).catch((err) => {
  logger.error(`Failed to connect to MongoDB on startup - retrying in 5 sec. -> ${err}`);
  setTimeout(() => connectWithRetry(mongoUrl), 5000);
});

module.exports = (mongoURL, logger) => connectWithRetry(mongoURL, logger).then((connection) => {
  logger.info('MongoDB Connection established', mongoURL);
  debug('MongoDB Connection established', mongoURL);
  return connection;
}).then(connection => ({
  create: function create(Aggregate, collectionName) {
    const stateDB = connection.db('states');
    const collection = stateDB.collection(collectionName);
    // Ensure index for state collection
    // no index for now except _id
    return new StateRepositoryMongo(collection, Aggregate);
  },
}));

