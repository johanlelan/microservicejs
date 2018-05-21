// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('server');

const Bus = require('./src/command/core/messaging/index');
const handlers = require('./src/command/core/command-handlers/index.js');
const readAPI = require('./src/query/read-api/app');
const writeAPI = require('./src/command/write-api/app');
const EventStore = require('./src/command/core/infrastructure/event-store');
const eventPublisher = require('./src/command/core/infrastructure/event-publisher');
const logger = require('./src/command/core/infrastructure/logger');

const eventStore = EventStore.create(logger);
const publisher = eventPublisher.create(logger);
// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

// Run messaging listener for queries
const queryWhenConnected = (channel) => {
  debug('Messaging query channel connected');
  return readAPI.run(channel, (errQuery) => {
    if (errQuery) { throw (errQuery); }
    return channel;
  });
};

// Run messaging listener and publisher
const commandWhenConnected = (channel) => {
  debug('Messaging command channel connected');
  return handlers(eventStore, publisher, logger, channel);
};

// connect to message broker
Bus.connect()
  .then(queryWhenConnected)
  .then(commandWhenConnected)
  .then((handler) => {
    // Run RESTful API
    writeAPI.run(handler, (errCommand) => {
      if (errCommand) { throw (errCommand); }
    });
  });
