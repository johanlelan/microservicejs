// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('microservice:command:server');

const Domain = require('./src/modules/domain');

// const concreteEvent = require('./src/modules/infrastructure/src/bus/event.amqp');
// const concreteCommand = require('./src/modules/infrastructure/src/bus/command.amqp');
const concreteEvent = require('./src/plugins/event.kafka');
const concreteCommand = require('./src/plugins/command.kafka');
const Infrastructure = require('./src/modules/infrastructure');
const handlers = require('./src/command-handlers/index.js');
const writeAPI = require('./src/interfaces/http/app');

const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const eventBus = Infrastructure.EventBus.create(concreteEvent);
const commandBus = Infrastructure.CommandBus.create(concreteCommand);

debug('Initializing command server...');

// Mongodb states repository
require('./src/plugins/event-store.mongo')(Infrastructure.logger, process.env.MONGO_URL || 'mongodb://localhost:27017')
  .then((EventStoreMongoDB) => {
    const eventStore = EventStoreMongoDB.create('demande-financement');
    const repository = Infrastructure.Repository.create(Domain.DemandeFinancement, eventStore);

    // every published events should be saved into event-store
    publisher.onAny((event) => {
      repository.save(event);
    });
    // connect to message broker
    handlers(repository, publisher, Infrastructure.logger)
      .then((handler) => {
        Infrastructure.logger.info('[Command] handler created');
        // connect to message broker
        Promise.all([
          // no repository needed for propagate event
          eventBus.connect(publisher, null, Infrastructure.logger, 'COMMAND'),
          commandBus.connect(handler, Infrastructure.logger),
        ]);
        writeAPI.run(handler, Infrastructure.logger, (errCommand) => {
          if (errCommand) { throw (errCommand); }
          Infrastructure.logger.info('[Command] HTTP API started');
        });
      });
  });

process.on('unhandledRejection', (error) => {
  // This prints error with stack included (as for normal errors)
  Infrastructure.logger.error(error);
});
