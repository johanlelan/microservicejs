// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('server');

const Bus = require('./src/core/messaging/index');
const handlers = require('./src/core/command-handlers/index.js');
const restAPI = require('./src/rest-api/app');
const EventStore = require('./src/core/infrastructure/event-store');
const eventPublisher = require('./src/core/infrastructure/event-publisher');
const logger = require('./src/core/infrastructure/logger');

const eventStore = EventStore.create(logger);
const publisher = eventPublisher.create(logger);
// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

// Run messaging listener and publisher
const whenConnected = (channel) => {
  debug('Messaging channel connected');
  return handlers(eventStore, publisher, logger, channel);
};

// connect to message broker
Bus.connect()
  .then(whenConnected)
  .then((handler) => {
  // Run RESTful API
    restAPI.run(handler, (err) => {
      if (err) { throw (err); }
    });
  });
