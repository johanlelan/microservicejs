
const debug = require('debug')('microservice:command:plugins:repository:mongo');
const MongoDB = require('mongodb');

const AggregateNotFound = require('../modules/infrastructure/src/AggregateNotFound');

const StateRepositoryMongo = function StateRepositoryMongo(collection, Aggregate, logger) {
  this.save = async function save(aggregate) {
    logger.info('Save new state into DB', aggregate);
    const insertAggregate = aggregate;
    insertAggregate._id = aggregate.id;
    // insert into mongodb the given eventId
    await collection.insertOne(insertAggregate);
    debug(`New state for Aggregate ${insertAggregate.aggregateId.id} saved into ${collection.collectionName}`);
    return aggregate;
  };

  this.getById = async function getById(aggregateId) {
    // find into mongodb the given aggregateId
    const state = await collection.findOne({ id: aggregateId }, { _id: 0 });
    if (!state) {
      logger.debug(`No entry for Aggregate ${aggregateId.id} in ${collection.collectionName}`, state);
      throw new AggregateNotFound('Not Found', { aggregateId });
    } else {
      debug(`Aggregate ${aggregateId.id} found in MongoDB`);
      return state;
    }
  };
};

exports.create = function create(logger) {
  return new StateRepositoryMongo(logger);
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

module.exports = (logger, mongoURL) => connectWithRetry(mongoURL, logger).then((connection) => {
  logger.info('MongoDB Connection established', mongoURL);
  debug('MongoDB Connection established', mongoURL);
  return connection;
}).then(connection => ({
  create: function create(Aggregate, collectionName) {
    const eventsDB = connection.db('states');
    const collection = eventsDB.collection(collectionName);
    collection.ensureIndex({ 'aggregateId.id': 1 });
    // Ensure index for state collection
    // no index for now except _id
    return new StateRepositoryMongo(collection, Aggregate, logger);
  },
}));

