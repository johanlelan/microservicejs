// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('microservice:query:server');

const Domain = require('./src/modules/domain');

// const concreteEvent = require('./src/modules/infrastructure/src/bus/event.amqp');
const concreteEvent = require('./src/plugins/event.kafka');
const Infrastructure = require('./src/modules/infrastructure');
const readAPI = require('./src/interfaces/http/app');

const eventStore = Infrastructure.EventStore.create(Infrastructure.logger);
const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const eventBus = Infrastructure.EventBus.create(concreteEvent);

// every published events should be saved into event-store
publisher.onAny((event) => {
  eventStore.append(event);
});

debug('Initializing query server...');

// Mongodb states repository
require('./src/plugins/repository.state.mongo')(process.env.MONGO_URL || 'mongodb://localhost:27017')
  .then((stateRepositoryImpl) => {
    const repository = stateRepositoryImpl.create(Domain.DemandeFinancement, 'demande-financement');

    // connect to message broker
    eventBus.connect(publisher, eventStore, repository, Infrastructure.logger, 'QUERY');

    readAPI.run(eventStore, repository, Infrastructure.logger, (errQuery) => {
      if (errQuery) { throw (errQuery); }
      Infrastructure.logger.info('[Query] HTTP API started');
    });
  });
