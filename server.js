// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('server');

const Bus = require('./src/infrastructure/bus/event');
const handlers = require('./src/command/command-handlers/index.js');
const readAPI = require('./src/interfaces/http/read-api/app');
const writeAPI = require('./src/interfaces/http//write-api/app');
const EventStore = require('./src/infrastructure/event-store');
const EventPublisher = require('./src/infrastructure/event-publisher');
const logger = require('./src/infrastructure/logger');

const eventStore = EventStore.create(logger);
const publisher = EventPublisher.create(logger);
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
  return handlers(eventStore, publisher, logger, channel)
    .then((handler) => {
      writeAPI.run(handler, (errCommand) => {
        if (errCommand) { throw (errCommand); }
      });
    });
};

// connect to message broker
Bus.connect()
  .then(queryWhenConnected)
  .then(commandWhenConnected);
