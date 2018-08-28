
const debug = require('debug')('microservice:command:plugins:event-store:mongo');
const MongoDB = require('mongodb');

const AggregateNotFound = require('../modules/infrastructure/src/AggregateNotFound');
const EventShouldBeNamed = require('../modules/infrastructure/src/EventShouldBeNamed');
const EventShouldContainsId = require('../modules/infrastructure/src/EventShouldContainsId');
const EventShouldContainsAggregateId = require('../modules/infrastructure/src/EventShouldContainsAggregateId');
const EventShouldContainsTimestamp = require('../modules/infrastructure/src/EventShouldContainsTimestamp');
const EventShouldContainsAuthor = require('../modules/infrastructure/src/EventShouldContainsAuthor');

const EventStoreMongo = function EventStoreMongo(collection, logger) {
  this.save = async function save(event) {
    logger.info('Save new event into DB', event);
    const insertEvent = event;
    insertEvent._id = event.id;
    // insert into mongodb the given eventId
    return collection.insertOne(insertEvent)
      .catch(error => logger.warn('Can not insert event', error))
      .then(() => {
        debug(`New event ${insertEvent.id} for Aggregate ${insertEvent.aggregateId.id} saved in ${collection.collectionName}`);
        return event;
      });
  };

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
        this.save(validatedEvent);
        return Promise.resolve(validatedEvent);
      });
  };

  this.getEventsOfAggregate = async function getEventsOfAggregate(aggregateId) {
    // find into mongodb the given aggregateId
    const events = await collection.find({ 'aggregateId.id': aggregateId.id }, { _id: 0 }).toArray();
    if (!events || events.length === 0) {
      logger.debug(`No entry for Aggregate ${aggregateId.id} in ${collection.collectionName}`, events);
      throw new AggregateNotFound('Not Found', { aggregateId });
    } else {
      debug(`Aggregate ${aggregateId.id} found in MongoDB`);
      return events;
    }
  };
};

exports.create = function create(logger) {
  return new EventStoreMongo(logger);
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
  setTimeout(() => connectWithRetry(mongoUrl, logger), 5000);
});

module.exports = (logger, mongoURL) => connectWithRetry(mongoURL, logger).then((connection) => {
  logger.info('MongoDB Connection established', mongoURL);
  debug('MongoDB Connection established', mongoURL);
  return connection;
}).then(connection => ({
  create: function create(collectionName) {
    const eventsDB = connection.db('events');
    const collection = eventsDB.collection(collectionName);
    collection.ensureIndex({ 'aggregateId.id': 1 });
    // Ensure index for state collection
    // no index for now except _id
    return new EventStoreMongo(collection, logger);
  },
}));

