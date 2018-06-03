// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('server');
const amqp = require('amqplib');

const Infrastructure = require('./src/modules/infrastructure');
const readAPI = require('./src/interfaces/http//app');

const eventStore = Infrastructure.EventStore.create(Infrastructure.logger);
const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const eventBus = Infrastructure.EventBus.create(amqp);

// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

debug('[Command] handler created');
// connect to message broker
eventBus.connect(publisher, eventStore, undefined, Infrastructure.logger)
  .then((channel) => {
    const promises = [
      eventBus.consumeIncomingEvents(channel, eventStore),
    ];
    return Promise.all(promises);
  });
readAPI.run(eventStore, Infrastructure.logger, (errQuery) => {
  if (errQuery) { throw (errQuery); }
  debug('[Query] HTTP API started');
});
