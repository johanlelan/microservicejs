// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('microservice:command:server');

const eventAMQP = require('./src/modules/infrastructure/src/bus/event.amqp');
const commandAMQP = require('./src/modules/infrastructure/src/bus/command.amqp');
const Infrastructure = require('./src/modules/infrastructure');
const handlers = require('./src/command-handlers/index.js');
const writeAPI = require('./src/interfaces/http/app');

const eventStore = Infrastructure.EventStore.create(Infrastructure.logger);
const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const commandBus = Infrastructure.CommandBus.create(commandAMQP);
const eventBus = Infrastructure.EventBus.create(eventAMQP);

// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

debug('Initializing command server...');

handlers(eventStore, publisher, Infrastructure.logger)
  .then((handler) => {
    Infrastructure.logger.info('[Command] handler created');
    // connect to message broker
    Promise.all([
      eventBus.connect(publisher, eventStore, Infrastructure.logger, 'COMMAND'),
      //        .then(channel => Promise.all([
      //          eventBus.propagateEvents(publisher, channel, Infrastructure.logger),
      //        ])),
      commandBus.connect(handler, publisher, eventStore, Infrastructure.logger),
      //        .then(channel => Promise.all([
      //          commandBus.consumeIncomingCommands(
      //            handler,
      //            channel,
      //            Infrastructure.logger,
      //         ),
      //        ])),
    ]);
    writeAPI.run(handler, Infrastructure.logger, (errCommand) => {
      if (errCommand) { throw (errCommand); }
      Infrastructure.logger.info('[Command] HTTP API started');
    });
  });
