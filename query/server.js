// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('microservice:query:server');

// const concreteEvent = require('./src/modules/infrastructure/src/bus/event.amqp');
const concreteEvent = require('./src/modules/infrastructure/src/bus/event.kafka');
const Infrastructure = require('./src/modules/infrastructure');
const readAPI = require('./src/interfaces/http//app');

const eventStore = Infrastructure.EventStore.create(Infrastructure.logger);
const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const eventBus = Infrastructure.EventBus.create(concreteEvent);

// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

debug('Initializing query server...');

// connect to message broker
eventBus.connect(publisher, eventStore, Infrastructure.logger, 'QUERY');
readAPI.run(eventStore, Infrastructure.logger, (errQuery) => {
  if (errQuery) { throw (errQuery); }
  Infrastructure.logger.info('[Query] HTTP API started');
});
