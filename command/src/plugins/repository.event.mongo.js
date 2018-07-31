
const debug = require('debug')('microservice:command:plugins:repository:mongo');
const MongoDB = require('mongodb');

const AggregateNotFound = require('../modules/infrastructure/src/AggregateNotFound');

const EventRepositoryMongo = function EventRepositoryMongo(collection, Aggregate, logger) {
  this.getAggregate = function getAggregate() {
    return Aggregate;
  };
  this.getById = async function getById(aggregateId) {
    // find into mongodb the given aggregateId
    const events = await collection.find({ 'aggregateId.id': aggregateId.id }, { _id: 0 }).toArray();
    if (!events || events.length === 0) {
      logger.debug(`No entry for Aggregate ${aggregateId.id} in ${collection.collectionName}`, events);
      throw new AggregateNotFound('Not Found', { aggregateId });
    } else {
      debug(`Aggregate ${aggregateId.id} found in MongoDB`);
      return this.getAggregate().createFromEvents(events);
    }
  };
  this.save = async function save(event) {
    logger.info('Save new event into DB', event);
    const insertEvent = event;
    insertEvent._id = event.id;
    // insert into mongodb the given eventId
    await collection.insertOne(insertEvent);
    debug(`New event for Aggregate ${insertEvent.aggregateId.id} saved in ${collection.collectionName}`);
    return event;
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
    const eventsDB = connection.db('events');
    const collection = eventsDB.collection(collectionName);
    collection.ensureIndex({ 'aggregateId.id': 1 });
    // Ensure index for state collection
    // no index for now except _id
    return new EventRepositoryMongo(collection, Aggregate, logger);
  },
}));

