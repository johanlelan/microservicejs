// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('server');
const amqp = require('amqplib');

const Infrastructure = require('./src/modules/infrastructure');
const handlers = require('./src/command-handlers/index.js');
const writeAPI = require('./src/interfaces/http/app');

const eventStore = Infrastructure.EventStore.create(Infrastructure.logger);
const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const eventBus = Infrastructure.EventBus.create(amqp);

// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

handlers(eventStore, publisher, Infrastructure.logger)
  .then((handler) => {
    debug('[Command] handler created');
    // connect to message broker
    eventBus.connect(publisher, eventStore, handler, Infrastructure.logger)
      .then((channel) => {
        const promises = [
          eventBus.propagateEvents(publisher, channel, Infrastructure.logger),
          eventBus.consumeIncomingCommands(
            handler,
            channel,
            Infrastructure.logger,
          ),
        ];
        return Promise.all(promises);
      });
    writeAPI.run(handler, Infrastructure.logger, (errCommand) => {
      if (errCommand) { throw (errCommand); }
      debug('[Command] HTTP API started');
    });
  });
